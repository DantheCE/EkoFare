export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center p-24 min-h-[50vh]">
      {/* 
          Testing our Syne Font and 800 weight 
      */}
      <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '48px' }}>
        EkoFare
      </h1>
      
      {/* 
          Testing our DM Sans Font 
      */}
      <p style={{ fontFamily: 'DM Sans', fontWeight: 400, fontSize: '18px', marginTop: '16px', opacity: 0.8 }}>
        Bootstrap Complete. System is Cream.
      </p>
    </main>
  );
}
