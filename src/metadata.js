export function buildMetadata({ title, artistName, description, coverUri, audioUri }) {
  return {
    name: title,
    artist: artistName,
    description,
    image: coverUri,
    animation_url: audioUri,
    attributes: [
      { trait_type: "Type", value: "Music Track" },
      { trait_type: "License", value: "Personal Online License" }
    ]
  };
}
