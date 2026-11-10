project('sample-adwaita', 'c',
  version: '0.1.0',
  meson_version: '>= 0.62.0',
  default_options: [
    'warning_level=2',
    'c_std=gnu11',
  ],
)

cc = meson.get_compiler('c')

gtk_dep = dependency('gtk4', required: false)
adw_dep = dependency('libadwaita-1', required: false)
keystore_dep = dependency('libfskeystore', required: false)

executable('sample-adwaita',
  'src/main.c',
  dependencies: [gtk_dep, adw_dep, keystore_dep],
  install: true
)
