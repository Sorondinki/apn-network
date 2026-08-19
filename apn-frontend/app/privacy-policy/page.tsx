// app/privacy-policy/page.tsx
export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 text-gray-300">
      <div className="p-8 rounded-3xl bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 border border-gray-800">
        <h1 className="text-3xl font-black text-white">Global Privacy Policy</h1>
        <p className="text-xs text-blue-400 mt-1 font-mono">
          Alpha Proficiency Network (APN) • Decentralized Foundation Standard
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-gray-900/40 border border-gray-800 space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Decentralized Data Principles</h2>
          <p>
            Alpha Proficiency Network (APN) operates as an autonomous, decentralized blockchain protocol. We prioritize user sovereignty, zero-knowledge privacy, and cryptographic security.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. Information Collection</h2>
          <p>
            APN Network does not store personal identity records, national identification numbers, or precise geo-location metadata. All network interactions are mapped via cryptographic wallet hashes and decentralized peer-to-peer node sync mechanisms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Global Encryption & Security</h2>
          <p>
            All node synchronization requests and balance updates are protected using standard TLS/SSL encryption and decentralized consensus engines distributed globally across independent validation nodes.
          </p>
        </section>
      </div>
    </div>
  );
}