import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dxpjikwepbeufjieduih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cGppa3dlcGJldWZqaWVkdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzE5NzEsImV4cCI6MjA4NzM0Nzk3MX0.Dk8OJVVLrcaeeZyHFjePm2UpesWZg-ajw1D0cVY4b14';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seed() {
  await supabase.auth.signInWithPassword({email:'admin@gentanala.com',password:'admin123'});
  
  console.log('Seeding materials...');
  // 1. Insert Materials
  const materials = [
    { name: 'Balok Kayu Jati', sku: 'RAW-JATI-001', type: 'raw', unit: 'block', description: 'Kayu jati grade A' },
    { name: 'Balok Kayu Sono', sku: 'RAW-SONO-001', type: 'raw', unit: 'block', description: 'Kayu sonokeling premium' },
    { name: 'Lembaran Kulit Sapi', sku: 'RAW-KULIT-001', type: 'raw', unit: 'sheet', description: 'Kulit sapi genuine leather' },
    { name: 'Mesin Miyota 2035', sku: 'RAW-MIYOTA-001', type: 'raw', unit: 'pcs', description: 'Movement Miyota Japan' },
    { name: 'Mesin Seiko NH35', sku: 'RAW-SEIKO-001', type: 'raw', unit: 'pcs', description: 'Movement Seiko automatic' },
    { name: 'Kaca Sapphire 42mm', sku: 'RAW-SAPH-42', type: 'raw', unit: 'pcs', description: 'Kaca sapphire crystal 42mm' },
    { name: 'Crown Stainless', sku: 'RAW-CROWN-SS', type: 'raw', unit: 'pcs', description: 'Crown stainless steel' },
    { name: 'Buckle Stainless', sku: 'RAW-BUCKLE-SS', type: 'raw', unit: 'pcs', description: 'Buckle strap stainless' },
    { name: 'Casing Hutan Tropis', sku: 'WIP-CASE-HT', type: 'wip', unit: 'pcs', description: 'Casing kayu jati' },
    { name: 'Casing Kaliandra', sku: 'WIP-CASE-KL', type: 'wip', unit: 'pcs', description: 'Casing kayu sono' },
    { name: 'Strap Kulit Brown', sku: 'WIP-STRAP-BR', type: 'wip', unit: 'pcs', description: 'Strap kulit sapi brown' },
    { name: 'Strap Kulit Black', sku: 'WIP-STRAP-BK', type: 'wip', unit: 'pcs', description: 'Strap kulit sapi black' }
  ];
  
  const { data: insertedMats, error: matErr } = await supabase.from('materials').insert(materials).select();
  if (matErr) console.log('Material err:', matErr);
  
  console.log('Seeding products...');
  // 2. Insert Products
  const products = [
    { name: 'Hutan Tropis 42mm', sku: 'FG-HT42-BLK', collection: 'Hutan Tropis', type: 'watch', description: 'Jam tangan kayu jati 42mm', sale_price: 1500000, cost_price: 500000, current_stock: 12, min_stock_threshold: 5, is_active: true },
    { name: 'Kaliandra 38mm', sku: 'FG-KL38-NAT', collection: 'Kaliandra', type: 'watch', description: 'Jam tangan kayu sono 38mm', sale_price: 1200000, cost_price: 450000, current_stock: 8, min_stock_threshold: 3, is_active: true },
    { name: 'Hutan Tropis 42mm Auto', sku: 'FG-HT42-AUTO', collection: 'Hutan Tropis', type: 'watch', description: 'Jam tangan kayu jati automatic', sale_price: 2500000, cost_price: 800000, current_stock: 5, min_stock_threshold: 2, is_active: true }
  ];
  
  const { data: insertedProds, error: prodErr } = await supabase.from('products').insert(products).select();
  if (prodErr) console.log('Product err:', prodErr);
  
  console.log('Seeding BOM...');
  // 3. Insert BOM (Product Materials)
  if (insertedMats && insertedProds) {
    const getMatId = (sku) => insertedMats.find(m => m.sku === sku)?.id;
    const getProdId = (sku) => insertedProds.find(p => p.sku === sku)?.id;
    
    const boms = [
      { product_id: getProdId('FG-HT42-BLK'), material_id: getMatId('WIP-CASE-HT'), quantity: 1 },
      { product_id: getProdId('FG-HT42-BLK'), material_id: getMatId('WIP-STRAP-BR'), quantity: 1 },
      { product_id: getProdId('FG-HT42-BLK'), material_id: getMatId('RAW-MIYOTA-001'), quantity: 1 },
      { product_id: getProdId('FG-HT42-BLK'), material_id: getMatId('RAW-SAPH-42'), quantity: 1 },
      
      { product_id: getProdId('FG-KL38-NAT'), material_id: getMatId('WIP-CASE-KL'), quantity: 1 },
      { product_id: getProdId('FG-KL38-NAT'), material_id: getMatId('WIP-STRAP-BK'), quantity: 1 },
      { product_id: getProdId('FG-KL38-NAT'), material_id: getMatId('RAW-SEIKO-001'), quantity: 1 },
      
      { product_id: getProdId('FG-HT42-AUTO'), material_id: getMatId('WIP-CASE-HT'), quantity: 1 },
      { product_id: getProdId('FG-HT42-AUTO'), material_id: getMatId('WIP-STRAP-BR'), quantity: 1 },
      { product_id: getProdId('FG-HT42-AUTO'), material_id: getMatId('RAW-SEIKO-001'), quantity: 1 }
    ].filter(b => b.product_id && b.material_id);
    
    const { error: bomErr } = await supabase.from('product_materials').insert(boms);
    if (bomErr) console.log('BOM err:', bomErr);
  }
  
  console.log('Seeding complete!');
}

seed();
