/**
 * LibreDroid Contacts Service
 * Contacts CRUD, groups, search, vCard import/export,
 * Nextcloud CardDAV sync, E2E encryption.
 */

import { systemBus } from './systemBus';
import { getBridgeToken } from './hardwareBridgeClient';

/* ─────────────────────────── Types ─────────────────────────── */

export interface ContactPhone {
  type: 'mobile' | 'home' | 'work' | 'other';
  number: string;
  primary?: boolean;
}

export interface ContactEmail {
  type: 'personal' | 'work' | 'other';
  address: string;
  primary?: boolean;
}

export interface ContactAddress {
  type: 'home' | 'work' | 'other';
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface Contact {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phones: ContactPhone[];
  emails: ContactEmail[];
  addresses: ContactAddress[];
  groups: string[];
  avatarColor?: string;
  avatarUri?: string;
  notes?: string;
  birthday?: string;
  organization?: string;
  title?: string;
  website?: string;
  encrypted: boolean;
  etag?: string;
  cardDavUri?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ContactGroup {
  id: string;
  name: string;
  memberIds: string[];
  color?: string;
}

export interface CardDavConfig {
  serverUrl: string;
  username: string;
  password: string;
  addressBookPath?: string;
}

export interface SyncResult {
  synced: number;
  created: number;
  updated: number;
  deleted: number;
  conflicts: number;
  errors: string[];
}

/* ─────────────────────────── Helpers ─────────────────────────── */

function generateId(): string {
  return `contact_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateGroupId(): string {
  return `group_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const token = getBridgeToken();
  if (token && !headers.has('x-lrd-token')) headers.set('x-lrd-token', token);
  return fetch(input, { ...init, headers });
}

/* ─────────────────────────── vCard ─────────────────────────── */

export function exportToVCard(contact: Contact): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.displayName}`,
  ];

  if (contact.firstName || contact.lastName) {
    lines.push(`N:${contact.lastName || ''};${contact.firstName || ''};;;`);
  }

  contact.phones.forEach((p) => {
    const typeStr = p.type.toUpperCase();
    lines.push(`TEL;TYPE=${typeStr}${p.primary ? ',PREF' : ''}:${p.number}`);
  });

  contact.emails.forEach((e) => {
    const typeStr = e.type.toUpperCase();
    lines.push(`EMAIL;TYPE=${typeStr}${e.primary ? ',PREF' : ''}:${e.address}`);
  });

  contact.addresses.forEach((a) => {
    lines.push(
      `ADR;TYPE=${a.type.toUpperCase()}:;;${a.street || ''};${a.city || ''};${a.state || ''};${a.zip || ''};${a.country || ''}`
    );
  });

  if (contact.organization) lines.push(`ORG:${contact.organization}`);
  if (contact.title) lines.push(`TITLE:${contact.title}`);
  if (contact.birthday) lines.push(`BDAY:${contact.birthday}`);
  if (contact.website) lines.push(`URL:${contact.website}`);
  if (contact.notes) lines.push(`NOTE:${contact.notes}`);
  if (contact.etag) lines.push(`X-ETAG:${contact.etag}`);

  lines.push(`X-LRD-ENCRYPTED:${contact.encrypted}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function importFromVCard(vcardText: string): Partial<Contact>[] {
  const cards = vcardText.split(/BEGIN:VCARD/i).filter(Boolean);
  return cards.map((card) => {
    const lines = card.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const get = (key: string) =>
      lines.find((l) => l.toUpperCase().startsWith(key.toUpperCase()))?.split(':').slice(1).join(':') || '';

    const phones: ContactPhone[] = lines
      .filter((l) => l.toUpperCase().startsWith('TEL'))
      .map((l) => {
        const typePart = l.match(/TYPE=([^:]+)/i)?.[1]?.split(',')[0]?.toLowerCase() || 'mobile';
        const number = l.split(':').slice(1).join(':');
        return { type: typePart as ContactPhone['type'], number, primary: l.includes('PREF') };
      });

    const emails: ContactEmail[] = lines
      .filter((l) => l.toUpperCase().startsWith('EMAIL'))
      .map((l) => {
        const typePart = l.match(/TYPE=([^:]+)/i)?.[1]?.split(',')[0]?.toLowerCase() || 'personal';
        const address = l.split(':').slice(1).join(':');
        return { type: typePart as ContactEmail['type'], address, primary: l.includes('PREF') };
      });

    const adrLine = get('ADR');
    const adrParts = adrLine.split(';');
    const addresses: ContactAddress[] = adrLine
      ? [{ type: 'home', street: adrParts[2], city: adrParts[3], state: adrParts[4], zip: adrParts[5], country: adrParts[6] }]
      : [];

    const nameParts = get('N').split(';');

    return {
      displayName: get('FN') || `${nameParts[1] || ''} ${nameParts[0] || ''}`.trim(),
      firstName: nameParts[1],
      lastName: nameParts[0],
      phones,
      emails,
      addresses,
      groups: [],
      organization: get('ORG'),
      title: get('TITLE'),
      birthday: get('BDAY'),
      website: get('URL'),
      notes: get('NOTE'),
      encrypted: false,
    };
  });
}

/* ─────────────────────────── Service ─────────────────────────── */

class ContactsService {
  private static instance: ContactsService;
  private contacts: Map<string, Contact> = new Map();
  private groups: Map<string, ContactGroup> = new Map();
  private cardDavConfig: CardDavConfig | null = null;
  private encryptionKey: CryptoKey | null = null;

  private constructor() {}

  public static getInstance(): ContactsService {
    if (!ContactsService.instance) {
      ContactsService.instance = new ContactsService();
    }
    return ContactsService.instance;
  }

  /* ─── CRUD ─── */

  public async create(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const contact: Contact = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      const res = await authFetch('/api/contacts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });
      if (res.ok) {
        const created: Contact = await res.json();
        this.contacts.set(created.id, created);
        systemBus.emit('contacts.created', created, 'contactsService');
        return created;
      }
    } catch {}

    this.contacts.set(contact.id, contact);
    systemBus.emit('contacts.created', contact, 'contactsService');
    return contact;
  }

  public async update(id: string, data: Partial<Contact>): Promise<Contact | null> {
    const existing = this.contacts.get(id);
    if (!existing) return null;

    const updated: Contact = { ...existing, ...data, id, updatedAt: Date.now() };

    try {
      const res = await authFetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const result: Contact = await res.json();
        this.contacts.set(id, result);
        systemBus.emit('contacts.updated', result, 'contactsService');
        return result;
      }
    } catch {}

    this.contacts.set(id, updated);
    systemBus.emit('contacts.updated', updated, 'contactsService');
    return updated;
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await authFetch(`/api/contacts/${id}`, { method: 'DELETE' });
    } catch {}

    const deleted = this.contacts.delete(id);
    if (deleted) systemBus.emit('contacts.deleted', { id }, 'contactsService');
    return deleted;
  }

  public get(id: string): Contact | undefined {
    return this.contacts.get(id);
  }

  public getAll(): Contact[] {
    return Array.from(this.contacts.values());
  }

  /* ─── Search ─── */

  public search(query: string): Contact[] {
    if (!query.trim()) return this.getAll();
    const q = query.toLowerCase();
    return this.getAll().filter((c) => {
      return (
        c.displayName.toLowerCase().includes(q) ||
        c.organization?.toLowerCase().includes(q) ||
        c.phones.some((p) => p.number.includes(q)) ||
        c.emails.some((e) => e.address.toLowerCase().includes(q))
      );
    });
  }

  /* ─── Groups ─── */

  public createGroup(name: string, color?: string): ContactGroup {
    const group: ContactGroup = {
      id: generateGroupId(),
      name,
      memberIds: [],
      color,
    };
    this.groups.set(group.id, group);
    return group;
  }

  public addToGroup(contactId: string, groupId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;
    if (!group.memberIds.includes(contactId)) {
      group.memberIds = [...group.memberIds, contactId];
    }
    return true;
  }

  public removeFromGroup(contactId: string, groupId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;
    group.memberIds = group.memberIds.filter((id) => id !== contactId);
    return true;
  }

  public getGroups(): ContactGroup[] {
    return Array.from(this.groups.values());
  }

  public getGroupMembers(groupId: string): Contact[] {
    const group = this.groups.get(groupId);
    if (!group) return [];
    return group.memberIds.map((id) => this.contacts.get(id)).filter(Boolean) as Contact[];
  }

  /* ─── vCard Import/Export ─── */

  public exportAllVCards(): string {
    return this.getAll().map(exportToVCard).join('\r\n');
  }

  public importVCards(vcardText: string): Contact[] {
    const partials = importFromVCard(vcardText);
    return partials.map((partial) =>
      this.contacts.set(partial.id || generateId(), {
        id: generateId(),
        displayName: partial.displayName || 'Unknown',
        phones: partial.phones || [],
        emails: partial.emails || [],
        addresses: partial.addresses || [],
        groups: [],
        encrypted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...partial,
      } as Contact)
    ).map((_, i) => Array.from(this.contacts.values()).slice(-partials.length)[i]);
  }

  /* ─── CardDAV Sync ─── */

  public setCardDavConfig(config: CardDavConfig): void {
    this.cardDavConfig = config;
  }

  public async syncCardDav(): Promise<SyncResult> {
    const result: SyncResult = { synced: 0, created: 0, updated: 0, deleted: 0, conflicts: 0, errors: [] };

    if (!this.cardDavConfig) {
      result.errors.push('CardDAV not configured');
      return result;
    }

    try {
      const res = await authFetch('/api/contacts/carddav/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.cardDavConfig),
      });
      if (res.ok) {
        const data = await res.json();
        const serverContacts: Contact[] = data.contacts || [];

        for (const sc of serverContacts) {
          const local = this.contacts.get(sc.id);
          if (!local) {
            this.contacts.set(sc.id, sc);
            result.created++;
          } else if (sc.updatedAt > local.updatedAt) {
            this.contacts.set(sc.id, sc);
            result.updated++;
          } else if (local.updatedAt > sc.updatedAt) {
            // Local is newer — push to server (handled on next POST)
            result.conflicts++;
          }
          result.synced++;
        }

        systemBus.emit('contacts.synced', result, 'contactsService');
        return result;
      }
    } catch (err: any) {
      result.errors.push(err?.message || 'Sync failed');
    }

    return result;
  }

  /* ─── E2E Encryption ─── */

  public async initEncryption(passphrase: string): Promise<boolean> {
    try {
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
      );
      this.encryptionKey = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: enc.encode('libredroid-contacts-v1'), iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      return true;
    } catch {
      return false;
    }
  }

  public async encryptContact(contact: Contact): Promise<Contact> {
    if (!this.encryptionKey) return contact;
    try {
      const enc = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = JSON.stringify({ notes: contact.notes, emails: contact.emails });
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        enc.encode(data)
      );
      const encBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
      const ivBase64 = btoa(String.fromCharCode(...iv));
      return {
        ...contact,
        notes: `enc:${ivBase64}:${encBase64}`,
        emails: [],
        encrypted: true,
      };
    } catch {
      return contact;
    }
  }

  /* ─── Fetch from Bridge ─── */

  public async loadFromBridge(): Promise<void> {
    try {
      const res = await authFetch('/api/contacts/list');
      if (res.ok) {
        const data = await res.json();
        const contacts: Contact[] = data.contacts || [];
        contacts.forEach((c) => this.contacts.set(c.id, c));
        return;
      }
    } catch {}

    // @mock — seed default contacts
    const mockContacts: Contact[] = [
      {
        id: 'c1', displayName: 'Alice Sovereign', firstName: 'Alice', lastName: 'Sovereign',
        phones: [{ type: 'mobile', number: '+1 555-0199', primary: true }],
        emails: [{ type: 'personal', address: 'alice@libredroid.local', primary: true }],
        addresses: [], groups: [], avatarColor: '#3b82f6',
        encrypted: false, createdAt: Date.now(), updatedAt: Date.now(),
      },
      {
        id: 'c2', displayName: 'Bob Libre', firstName: 'Bob', lastName: 'Libre',
        phones: [{ type: 'mobile', number: '+1 555-0142', primary: true }],
        emails: [{ type: 'personal', address: 'bob@nextcloud.local', primary: true }],
        addresses: [], groups: [], avatarColor: '#10b981',
        encrypted: false, createdAt: Date.now(), updatedAt: Date.now(),
      },
    ];
    mockContacts.forEach((c) => this.contacts.set(c.id, c));
  }
}

export const contactsService = ContactsService.getInstance();
export default contactsService;
