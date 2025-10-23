export function GravityChangeUI() {
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-black/40 backdrop-blur-md border border-gray-700 rounded-2xl px-6 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <p className="text-white text-center">
          Press{" "}
          <span className="bg-purple-600 px-2 py-1 rounded font-bold">G</span>{" "}
          to change gravity towards your facing direction
        </p>
      </div>
    </div>
  );
}
