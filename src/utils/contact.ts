import { supabase } from './supabase';

export interface ContactInfo {
  whatsapp: string;       // format: 628xxxx (untuk wa.me URL)
  whatsappDisplay: string;  // format: 08xxxxx (untuk ditampilkan)
  address: string;
}

export async function getContactInfo(): Promise<ContactInfo> {
  const { data } = await supabase
    .from('landing_sections')
    .select('extra')
    .eq('section_key', 'contact')
    .single();

  return {
    whatsapp: data?.extra?.whatsapp ?? '6285828331717',
    whatsappDisplay: data?.extra?.whatsapp_display ?? '085828331717',
    address: data?.extra?.address ?? 'Jl. Raden Inten II No.66, RT.1/RW.7, Duren Sawit, Kota Jakarta Timur 13440',
  };
}
