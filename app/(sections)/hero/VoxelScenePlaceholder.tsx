/**
 * Placeholder for the voxel village scene. Tall (~120vh / 2x what it was)
 * so the scene reads as a real centerpiece and not a band. Layer 4 will
 * replace this with the production voxel render.
 */
export function VoxelScenePlaceholder() {
  return (
    <div
      role="img"
      aria-label="Voxel village placeholder, to be replaced by the real isometric voxel render in Layer 4"
      className="relative h-[160vh] min-h-[1100px] w-full overflow-hidden bg-bg-base"
      style={{
        backgroundImage: "url('/voxel-village-placeholder.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    />
  )
}
