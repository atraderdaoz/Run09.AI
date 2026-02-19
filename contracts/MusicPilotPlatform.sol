// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MusicPilotPlatform is ERC721, Ownable {
    enum SubscriptionRole {
        None,
        Artist,
        User,
        Merchant
    }

    struct Subscription {
        uint8 tier;
        uint64 expiresAt;
    }

    struct Track {
        address artist;
        string coverUri;
        string audioUri;
        string metadataUri;
        uint256 priceWei;
        bool exists;
    }

    struct CpmReport {
        uint64 timestamp;
        uint256 trackId;
        uint256 impressions;
        uint256 cpmUsdMicros;
        address reporter;
    }

    uint256 public nextTrackId = 1;
    uint256 public nextLicenseId = 1;
    address public cpmOracle;

    mapping(address => mapping(SubscriptionRole => Subscription)) public subscriptions;
    mapping(uint256 => Track) public tracks;
    mapping(uint256 => uint256) public licenseToTrack;
    mapping(address => mapping(uint256 => bool)) public userHasLicenseForTrack;
    CpmReport[] private cpmReports;

    event SubscriptionSet(address indexed user, SubscriptionRole indexed role, uint8 tier, uint64 expiresAt);
    event TrackRegistered(uint256 indexed trackId, address indexed artist, string metadataUri, uint256 priceWei);
    event LicensePurchased(uint256 indexed licenseId, uint256 indexed trackId, address indexed buyer, uint256 priceWei);
    event CpmOracleUpdated(address indexed oracle);
    event CpmReported(uint256 indexed reportIndex, uint256 indexed trackId, uint256 impressions, uint256 cpmUsdMicros, address reporter);

    constructor(address initialOwner) ERC721("MusicPilotLicense", "MPL") Ownable(initialOwner) {}

    function setCpmOracle(address oracle_) external onlyOwner {
        cpmOracle = oracle_;
        emit CpmOracleUpdated(oracle_);
    }

    function setSubscription(
        address user,
        SubscriptionRole role,
        uint8 tier,
        uint64 expiresAt
    ) external onlyOwner {
        require(role != SubscriptionRole.None, "invalid role");
        subscriptions[user][role] = Subscription({tier: tier, expiresAt: expiresAt});
        emit SubscriptionSet(user, role, tier, expiresAt);
    }

    function hasActiveSubscription(address user, SubscriptionRole role) public view returns (bool) {
        Subscription memory sub = subscriptions[user][role];
        return sub.expiresAt >= block.timestamp;
    }

    function getSubscription(address user, SubscriptionRole role) external view returns (Subscription memory) {
        return subscriptions[user][role];
    }

    function registerTrack(
        string calldata coverUri,
        string calldata audioUri,
        string calldata metadataUri,
        uint256 priceWei
    ) external returns (uint256 trackId) {
        require(hasActiveSubscription(msg.sender, SubscriptionRole.Artist), "artist subscription required");
        require(priceWei > 0, "price must be > 0");

        trackId = nextTrackId++;
        tracks[trackId] = Track({
            artist: msg.sender,
            coverUri: coverUri,
            audioUri: audioUri,
            metadataUri: metadataUri,
            priceWei: priceWei,
            exists: true
        });

        emit TrackRegistered(trackId, msg.sender, metadataUri, priceWei);
    }

    function buyLicense(uint256 trackId) external payable returns (uint256 licenseId) {
        Track memory t = tracks[trackId];
        require(t.exists, "track not found");
        require(msg.value == t.priceWei, "incorrect payment");

        licenseId = nextLicenseId++;
        _mint(msg.sender, licenseId);
        licenseToTrack[licenseId] = trackId;
        userHasLicenseForTrack[msg.sender][trackId] = true;

        (bool ok, ) = payable(t.artist).call{value: msg.value}("");
        require(ok, "transfer failed");

        emit LicensePurchased(licenseId, trackId, msg.sender, msg.value);
    }

    function canDownload(address user, uint256 trackId) external view returns (bool) {
        return userHasLicenseForTrack[user][trackId] || hasActiveSubscription(user, SubscriptionRole.User);
    }

    function isCommerciallyActive(address user) external view returns (bool) {
        return hasActiveSubscription(user, SubscriptionRole.Merchant);
    }

    function postCpmReport(
        uint256 trackId,
        uint256 impressions,
        uint256 cpmUsdMicros
    ) external {
        require(msg.sender == owner() || msg.sender == cpmOracle, "not authorized");
        require(tracks[trackId].exists, "track not found");

        cpmReports.push(
            CpmReport({
                timestamp: uint64(block.timestamp),
                trackId: trackId,
                impressions: impressions,
                cpmUsdMicros: cpmUsdMicros,
                reporter: msg.sender
            })
        );

        emit CpmReported(cpmReports.length - 1, trackId, impressions, cpmUsdMicros, msg.sender);
    }

    function cpmReportCount() external view returns (uint256) {
        return cpmReports.length;
    }

    function getCpmReport(uint256 index) external view returns (CpmReport memory) {
        require(index < cpmReports.length, "index out of bounds");
        return cpmReports[index];
    }
}
