import { WebIrys } from "@irys/sdk";

export async function createIrysUploader() {
  if (!window.ethereum) throw new Error("MetaMask required for Irys upload");

  const irys = new WebIrys({
    network: "testnet",
    token: "bnb",
    wallet: { provider: window.ethereum },
    config: { providerUrl: "https://data-seed-prebsc-1-s1.binance.org:8545" }
  });

  await irys.ready();
  return irys;
}

export async function uploadFile(irys, file, contentType) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const receipt = await irys.upload(bytes, {
    tags: [{ name: "Content-Type", value: contentType }]
  });
  return `https://gateway.irys.xyz/${receipt.id}`;
}

export async function uploadJson(irys, data) {
  const receipt = await irys.upload(JSON.stringify(data), {
    tags: [{ name: "Content-Type", value: "application/json" }]
  });
  return `https://gateway.irys.xyz/${receipt.id}`;
}
