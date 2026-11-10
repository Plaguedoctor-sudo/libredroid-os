/*
 * SPDX-License-Identifier: Apache-2.0 OR GPL-3.0-or-later
 * FreeStack Sovereign Keystore AIDL Interface Specification (Task 5.9)
 */

package org.freestack.security.keystore;

/**
 * Key metadata and constraints
 */
parcelable KeyDescriptor {
    String alias;
    int algorithm;
    int purposeMask;
    boolean hardwareBacked;
    boolean userPresenceRequired;
    long createdAt;
}

/**
 * Hardware PCR and attestation statement
 */
parcelable AttestationRecord {
    byte[] pcrDigest;
    byte[] certificateChain;
    byte[] signature;
    long timestamp;
}

/**
 * Result structure for crypto operations
 */
parcelable OperationResult {
    int returnCode;
    byte[] data;
}

/**
 * Sovereign App-facing Keystore Service
 */
interface IKeystoreService {
    int generateKey(in String alias, int algorithm, int purposeMask, boolean hardwareBacked);
    int deleteKey(in String alias);
    KeyDescriptor getDescriptor(in String alias);
    OperationResult sign(in String alias, in byte[] digest);
    boolean verify(in String alias, in byte[] digest, in byte[] signature);
    OperationResult encrypt(in String alias, in byte[] plaintext);
    OperationResult decrypt(in String alias, in byte[] ciphertext);
    AttestationRecord attestKey(in String alias, in byte[] nonce);
    String[] listKeys();
}
