import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

type Product = {
  id: number
  name: string
  description: string
  image_url: string
}

function App() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const fetchData = async () => {
  const { data, error } = await supabase.from("inventory").select("*");
  if (error) {
    console.error('🔥 Supabase fetch error:', error.message)
  }

  console.log('📦 products の中身:', data)
  if (data) setProducts(data)
}
    fetchData()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>在庫一覧</h1>
      {products.length === 0 && <p>在庫がありません</p>}
      {products.map((product) => (
  <div key={product.id} style={{ borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
    <h3>{product.name}</h3>
    <p>{product.description}</p>
    {product.image_url && (
      <img
        src={product.image_url}
        alt={product.name}
        style={{ width: '120px', height: 'auto', objectFit: 'cover', marginTop: '8px' }}
      />
    )}
  </div>
))}

export default App