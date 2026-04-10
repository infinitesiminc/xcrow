UPDATE public.flash_accounts SET stage = 'competitor', updated_at = now() WHERE id IN (
  'acct-airgarage',
  'acct-curbstand',
  'acct-luxe-valet',
  'acct-reef',
  'acct-parkwhiz',
  'acct-parkjockey',
  'acct-parkhub',
  'acct-smarking',
  'acct-parkoffice',
  'acct-t2-systems',
  'acct-skidata',
  'acct-tiba',
  'acct-amano-mcgann',
  'acct-designa'
);

UPDATE public.flash_accounts SET stage = 'target', updated_at = now() WHERE id = 'acct-central';