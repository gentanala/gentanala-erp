import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dxpjikwepbeufjieduih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cGppa3dlcGJldWZqaWVkdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzE5NzEsImV4cCI6MjA4NzM0Nzk3MX0.Dk8OJVVLrcaeeZyHFjePm2UpesWZg-ajw1D0cVY4b14';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seed() {
  await supabase.auth.signInWithPassword({email:'admin@gentanala.com',password:'admin123'});
  
  // Clean first
  await supabase.from('product_materials').delete().neq('product_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Seeding materials...');
  // The column in DB is 'code', not 'sku'. Also 'type' is not in schema but our code maps it.
  // Oh wait, schema says: materials(id, code, name, description, unit, cost_per_unit, current_stock, min_stock_threshold, is_active)
  // Our code expects 'sku' and 'type', so let's modify the code or the insert data.
  // Actually, wait, let's insert into schema tables:
  const materials = [
    { name: 'Balok Kayu Jati', code: 'RAW-JATI-001', unit: 'block', description: 'Kayu jati grade A' },
    { name: 'Balok Kayu Sono', code: 'RAW-SONO-001', unit: 'block', description: 'Kayu sonokeling premium' },
    { name: 'Lembaran Kulit Sapi', code: 'RAW-KULIT-001', unit: 'sheet', description: 'Kulit sapi genuine leather' },
    { name: 'Mesin Miyota 2035', code: 'RAW-MIYOTA-001', unit: 'pcs', description: 'Movement Miyota Japan' },
    { name: 'Mesin Seiko NH35', code: 'RAW-SEIKO-001', unit: 'pcs', description: 'Movement Seiko automatic' },
    { name: 'Kaca Sapphire 42mm', code: 'RAW-SAPH-42', unit: 'pcs', description: 'Kaca sapphire crystal 42mm' },
    { name: 'Crown Stainless', code: 'RAW-CROWN-SS', unit: 'pcs', description: 'Crown stainless steel' },
    { name: 'Buckle Stainless', code: 'RAW-BUCKLE-SS', unit: 'pcs', description: 'Buckle strap stainless' },
    { name: 'Casing Hutan Tropis', code: 'WIP-CASE-HT', unit: 'pcs', description: 'Casing kayu jati' },
    { name: 'Casing Kaliandra', code: 'WIP-CASE-KL', unit: 'pcs', description: 'Casing kayu sono' },
    { name: 'Strap Kulit Brown', code: 'WIP-STRAP-BR', unit: 'pcs', description: 'Strap kulit sapi brown' },
    { name: 'Strap Kulit Black', code: 'WIP-STRAP-BK', unit: 'pcs', description: 'Strap kulit sapi black' }
  ];
  
  const { data: insertedMats, error: matErr } = await supabase.from('materials').insert(materials).select();
  if (matErr) console.log('Material err:', matErr);
  
  console.log('Seeding products...');
  const products = [
    { name: 'Hutan Tropis 42mm', sku: 'FG-HT42-BLK', collection: 'Hutan Tropis', type: 'watch', description: 'Jam tangan kayu jati 42mm', sale_price: 1500000, cost_price: 500000, current_stock: 12, min_stock_threshold: 5, is_active: true },
    { name: 'Kaliandra 38mm', sku: 'FG-KL38-NAT', collection: 'Kaliandra', type: 'watch', description: 'Jam tangan kayu sono 38mm', sale_price: 1200000, cost_price: 450000, current_stock: 8, min_stock_threshold: 3, is_active: true },
    { name: 'Hutan Tropis 42mm Auto', sku: 'FG-HT42-AUTO', collection: 'Hutan Tropis', type: 'watch', description: 'Jam tangan kayu jati automatic', sale_price: 2500000, cost_price: 800000, current_stock: 5, min_stock_threshold: 2, is_active: true }
  ];
  
  let insertedProds = [];
  for (const p of products) {
    // Upsert or insert ignore if exist
    const {data: pExisting} = await supabase.from('products').select().eq('sku', p.sku).single();
    if (pExisting) {
       insertedProds.push(pExisting);
       continue;
    }
    const { data: pNew, error: prodErr } = await supabase.from('products').insert(p).select().single();
    if (prodErr) console.log('Product err:', prodErr);
    else insertedProds.push(pNew);
  }
  
  console.log('Seeding BOM...');
  if (insertedMats && insertedProds) {
    const getMatId = (code) => insertedMats.find(m => m.code === code)?.id;
    const getProdId = (sku) => insertedProds.find(p => p.sku === sku)?.id;
    
    const boms = [
      { product_id: getProdId('FG-HT42-BLK'), material_id: getMatId('WIP-CASE-HT'), quantity_required: 1 },
      { product_id: getProdId('FG-HT42-BLK'), material_id: getMatId('WIP-STRAP-BR'), quantity_required: 1 },
      { product_id: getProdId('FG-HT42-BLK'), material_id: getMatId('RAW-MIYOTA-001'), quantity_required: 1 },
      { product_id: getProdId('FG-HT42-BLK'), material_id: getMatId('RAW-SAPH-42'), quantity_required: 1 },
      
      { product_id: getProdId('FG-KL38-NAT'), material_id: getMatId('WIP-CASE-KL'), quantity_required: 1 },
      { product_id: getProdId('FG-KL38-NAT'), material_id: getMatId('WIP-STRAP-BK'), quantity_required: 1 },
      { product_id: getProdId('FG-KL38-NAT'), material_id: getMatId('RAW-SEIKO-001'), quantity_required: 1 },
      
      { product_id: getProdId('FG-HT42-AUTO'), material_id: getMatId('WIP-CASE-HT'), quantity_required: 1 },
      { product_id: getProdId('FG-HT42-AUTO'), material_id: getMatId('WIP-STRAP-BR'), quantity_required: 1 },
      { product_id: getProdId('FG-HT42-AUTO'), material_id: getMatId('RAW-SEIKO-001'), quantity_required: 1 }
    ].filter(b => b.product_id && b.material_id);
    
    // delete previous BOMs just in case
    await supabase.from('product_materials').delete().in('product_id', insertedProds.map(p=>p.id));

    const { error: bomErr } = await supabase.from('product_materials').insert(boms);
    if (bomErr) console.log('BOM err:', bomErr);
  }
  
  console.log('Data injected!');
}

seed();
