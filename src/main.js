import "./style.css";
import { connectWallet, getPlatformContract, roleToEnum } from "./platform.js";
import { createIrysUploader, uploadFile, uploadJson } from "./irys.js";
import { buildMetadata } from "./metadata.js";

const app = document.querySelector("#app");

app.innerHTML = `
  <h1>Web3 Music Pilot (BSC Testnet)</h1>
  <p>Contract: <code id="contractAddr"></code></p>
  <button id="connect">Connect Wallet</button>
  <p id="whoami">Not connected</p>

  <section>
    <h2>1) Subscriptions (Owner only)</h2>
    <input id="subUser" placeholder="Wallet address" />
    <select id="subRole"><option value="artist">Artist</option><option value="user">User</option><option value="merchant">Merchant</option></select>
    <input id="subTier" type="number" min="1" value="1" />
    <input id="subDays" type="number" min="1" value="30" />
    <button id="setSub">Set Subscription</button>
  </section>

  <section>
    <h2>2 & 3) Upload via Irys + Register Track</h2>
    <input id="title" placeholder="Track title" />
    <input id="artistName" placeholder="Artist name" />
    <textarea id="desc" placeholder="Description"></textarea>
    <input id="price" type="number" min="0" step="0.0001" placeholder="Price in tBNB" />
    <label>Cover <input id="cover" type="file" accept="image/*" /></label>
    <label>Audio <input id="audio" type="file" accept="audio/*" /></label>
    <button id="uploadRegister">Upload + Register</button>
    <pre id="trackResult"></pre>
  </section>

  <section>
    <h2>4 & 5) License/Subscription Gated Download + Merchant Status</h2>
    <input id="trackId" type="number" min="1" placeholder="Track ID" />
    <button id="loadTrack">Load Track</button>
    <button id="buyLicense">Buy License</button>
    <button id="checkGate">Check Download Access</button>
    <p id="merchantStatus"></p>
    <a id="downloadLink" href="#" target="_blank" rel="noreferrer">Download (gated)</a>
    <pre id="gateResult"></pre>
  </section>

  <section>
    <h2>6) CPM Reports (owner/oracle)</h2>
    <input id="cpmTrackId" type="number" min="1" placeholder="Track ID" />
    <input id="impressions" type="number" min="0" placeholder="Impressions" />
    <input id="cpmMicros" type="number" min="0" placeholder="CPM in USD micros" />
    <button id="postCpm">Post CPM Report</button>
    <button id="viewCpm">View Latest CPM Reports</button>
    <pre id="cpmOut"></pre>
  </section>

  <p id="status"></p>
`;

const state = { signer: null, address: null, contract: null, currentTrack: null };
const $ = (id) => document.getElementById(id);
const setStatus = (msg) => ($("status").textContent = msg);

$("contractAddr").textContent = ((((import.meta && import.meta.env && import.meta.env.VITE_PLATFORM_ADDRESS) || window.VITE_PLATFORM_ADDRESS || "").trim()) || "(missing VITE_PLATFORM_ADDRESS)");
const envAddress = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_PLATFORM_ADDRESS) || window.VITE_PLATFORM_ADDRESS || "";
$("contractAddr").textContent = envAddress || "(missing VITE_PLATFORM_ADDRESS)";

$("connect").onclick = async () => {
  try {
    const { signer, address } = await connectWallet();
    state.signer = signer;
    state.address = address;
    state.contract = getPlatformContract(signer);
    $("whoami").textContent = `Connected: ${address}`;
    setStatus("Wallet connected");
  } catch (e) {
    setStatus(`Connect failed: ${e.message}`);
  }
};

$("setSub").onclick = async () => {
  try {
    const role = roleToEnum($("subRole").value);
    const tier = Number($("subTier").value);
    const expiresAt = BigInt(Math.floor(Date.now() / 1000 + Number($("subDays").value) * 86400));
    const tx = await state.contract.setSubscription($("subUser").value.trim(), role, tier, expiresAt);
    await tx.wait();
    setStatus("Subscription set");
  } catch (e) {
    setStatus(`Set subscription failed: ${e.message}`);
  }
};

$("uploadRegister").onclick = async () => {
  try {
    setStatus("Preparing Irys uploader...");
    const irys = await createIrysUploader();
    const coverFile = $("cover").files[0];
    const audioFile = $("audio").files[0];
    if (!coverFile || !audioFile) throw new Error("Cover and audio are required");

    setStatus("Uploading cover...");
    const coverUri = await uploadFile(irys, coverFile, coverFile.type || "image/*");
    setStatus("Uploading audio...");
    const audioUri = await uploadFile(irys, audioFile, audioFile.type || "audio/*");

    const metadata = buildMetadata({
      title: $("title").value,
      artistName: $("artistName").value,
      description: $("desc").value,
      coverUri,
      audioUri
    });

    setStatus("Uploading metadata...");
    const metadataUri = await uploadJson(irys, metadata);

    setStatus("Registering track on-chain...");
    const priceWei = window.ethers.parseEther($("price").value || "0");
    const tx = await state.contract.registerTrack(coverUri, audioUri, metadataUri, priceWei);
    const receipt = await tx.wait();

    $("trackResult").textContent = JSON.stringify({ coverUri, audioUri, metadataUri, tx: receipt.hash }, null, 2);
    setStatus("Track uploaded + registered");
  } catch (e) {
    setStatus(`Upload/register failed: ${e.message}`);
  }
};

$("loadTrack").onclick = async () => {
  try {
    const trackId = Number($("trackId").value);
    const t = await state.contract.tracks(trackId);
    if (!t.exists) throw new Error("Track not found");
    state.currentTrack = { id: trackId, ...t };
    $("downloadLink").href = t.audioUri;
    $("downloadLink").textContent = `Download Track ${trackId}`;
    const isMerchant = await state.contract.isCommerciallyActive(state.address);
    $("merchantStatus").textContent = `Commercial status: ${isMerchant ? "ACTIVE" : "INACTIVE"}`;
    setStatus("Track loaded");
  } catch (e) {
    setStatus(`Load failed: ${e.message}`);
  }
};

$("buyLicense").onclick = async () => {
  try {
    const trackId = Number($("trackId").value);
    const t = await state.contract.tracks(trackId);
    const tx = await state.contract.buyLicense(trackId, { value: t.priceWei });
    await tx.wait();
    setStatus("License purchased");
  } catch (e) {
    setStatus(`License purchase failed: ${e.message}`);
  }
};

$("checkGate").onclick = async () => {
  try {
    const trackId = Number($("trackId").value);
    const ok = await state.contract.canDownload(state.address, trackId);
    $("gateResult").textContent = `Download access: ${ok}`;
    if (!ok) {
      $("downloadLink").removeAttribute("href");
      $("downloadLink").textContent = "Download blocked";
    }
    setStatus("Gate check complete");
  } catch (e) {
    setStatus(`Gate check failed: ${e.message}`);
  }
};

$("postCpm").onclick = async () => {
  try {
    const tx = await state.contract.postCpmReport(
      Number($("cpmTrackId").value),
      Number($("impressions").value),
      Number($("cpmMicros").value)
    );
    await tx.wait();
    setStatus("CPM report posted");
  } catch (e) {
    setStatus(`Post CPM failed: ${e.message}`);
  }
};

$("viewCpm").onclick = async () => {
  try {
    const count = Number(await state.contract.cpmReportCount());
    const start = Math.max(0, count - 10);
    const rows = [];
    for (let i = start; i < count; i++) {
      const r = await state.contract.getCpmReport(i);
      rows.push({
        index: i,
        trackId: Number(r.trackId),
        impressions: Number(r.impressions),
        cpmUsdMicros: Number(r.cpmUsdMicros),
        reporter: r.reporter,
        timestamp: new Date(Number(r.timestamp) * 1000).toISOString()
      });
    }
    $("cpmOut").textContent = JSON.stringify(rows, null, 2);
    setStatus("Loaded CPM reports");
  } catch (e) {
    setStatus(`View CPM failed: ${e.message}`);
  }
};
