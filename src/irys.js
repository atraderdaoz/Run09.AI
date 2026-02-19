function getIrysProvider() {
  if (!window.ethereum) throw new Error("MetaMask required for Irys upload");
  return window.ethereum;
}

export async function createIrysUploader() {
  const token = "bnb";
  const network = "testnet";
  const provider = getIrysProvider();

  const Irys = window.Irys || window.WebIrys || window.IrysSdk;
  if (!Irys) throw new Error("Irys SDK not loaded");
  const irys = new Irys({ network, token, key: provider, config: { providerUrl: "https://data-seed-prebsc-1-s1.binance.org:8545" } });
  await irys.ready();
  return irys;
}

export async function uploadFile(irys, file, contentType) {
  const buffer = await file.arrayBuffer();
  const receipt = await irys.upload(new Uint8Array(buffer), {
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
