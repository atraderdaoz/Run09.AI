export const PLATFORM_ABI = [
  "function setSubscription(address user,uint8 role,uint8 tier,uint64 expiresAt)",
  "function getSubscription(address user,uint8 role) view returns (tuple(uint8 tier,uint64 expiresAt))",
  "function hasActiveSubscription(address user,uint8 role) view returns (bool)",
  "function registerTrack(string coverUri,string audioUri,string metadataUri,uint256 priceWei) returns (uint256)",
  "function tracks(uint256) view returns (address artist,string coverUri,string audioUri,string metadataUri,uint256 priceWei,bool exists)",
  "function buyLicense(uint256 trackId) payable returns (uint256)",
  "function canDownload(address user,uint256 trackId) view returns (bool)",
  "function isCommerciallyActive(address user) view returns (bool)",
  "function postCpmReport(uint256 trackId,uint256 impressions,uint256 cpmUsdMicros)",
  "function cpmReportCount() view returns (uint256)",
  "function getCpmReport(uint256 index) view returns (tuple(uint64 timestamp,uint256 trackId,uint256 impressions,uint256 cpmUsdMicros,address reporter))"
];

export async function connectWallet() {
  if (!window.ethereum) throw new Error("MetaMask not found");
  if (!window.ethers) throw new Error("Ethers library not loaded");

  const provider = new window.ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  return { provider, signer, address: await signer.getAddress() };
}

export function getPlatformContract(signerOrProvider) {
  const address = import.meta.env.VITE_PLATFORM_ADDRESS;
  if (!address) throw new Error("Missing VITE_PLATFORM_ADDRESS in env");
  return new window.ethers.Contract(address, PLATFORM_ABI, signerOrProvider);
}

export function roleToEnum(role) {
  return { artist: 1, user: 2, merchant: 3 }[role];
}
