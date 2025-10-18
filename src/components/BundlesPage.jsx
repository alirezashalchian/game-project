import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";

export default function BundlesPage() {
  const bundles = [
    {
      name: "Building Materials Bundle",
      color: "from-sky-500 to-blue-600",
      blocks: [
        "/models/gltf/stone.png",
        "/models/gltf/metal.png",
        "/models/gltf/lava.png",
      ],
    },
    {
      name: "Decorative Bundle",
      color: "from-orange-400 to-red-500",
      blocks: [
        "/models/gltf/orange.png",
        "/models/gltf/purple.png",
        "/models/gltf/blue.png",
      ],
    },
    {
      name: "Ground Bundle",
      color: "from-green-400 to-lime-600",
      blocks: [
        "/models/gltf/dirt.png",
        "/models/gltf/grass.png",
        "/models/gltf/blueblock.png",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold">Bundles</h1>
        <div className="flex items-center gap-2 bg-yellow-400 text-slate-900 px-4 py-2 rounded-full shadow-lg">
          <Coins className="w-5 h-5" />
          <span className="font-semibold">98,765</span>
        </div>
      </div>

      {/* Bundles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {bundles.map((bundle, idx) => (
          <Card
            key={idx}
            className={`bg-gradient-to-br ${bundle.color} text-white shadow-xl hover:scale-105 transition-transform`}
          >
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                {bundle.name}
              </CardTitle>
            </CardHeader>

            <CardContent className="flex justify-center gap-3 py-4">
              {bundle.blocks.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="block"
                  className="w-16 h-16 rounded-lg shadow-lg border border-white/20"
                />
              ))}
            </CardContent>

            <CardFooter className="flex justify-center">
              <Button className="text-lg font-semibold bg-pink-500 hover:bg-pink-600 w-32 h-12 rounded-xl shadow-md">
                BUY
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Footer help button */}
      <div className="fixed bottom-6 right-6">
        <Badge variant="secondary" className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-full">
          Help
        </Badge>
      </div>
    </div>
  );
}
