"use client";

import { useState, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { modelCatalog, modelCategories } from "../models";
import { useRoom } from "./RoomContext";

// Import shadcn components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Menu, Rotate3D, MousePointerClick, X } from "lucide-react";

export function ModelSelectorUI() {
  const {
    selectedModel,
    setSelectedModel,
    isPlacementMode,
    setIsPlacementMode,
  } = useRoom();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isHelpDialogOpen, setisHelpDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Preload all models when component mounts
  useEffect(() => {
    console.log("Preloading models from selector UI...");
    modelCatalog.forEach((model) => {
      useGLTF.preload(model.path);
    });
  }, []);

  const filteredModels =
    selectedCategory === "all"
      ? modelCatalog
      : modelCatalog.filter((model) => model.category === selectedCategory);

  const handleSelectModel = (model) => {
    // Ensure this specific model is loaded before setting it
    // useGLTF.preload(model.path);
    setSelectedModel(model);
    setIsPlacementMode(true);
  };

  const handleCancelPlacement = () => {
    setIsPlacementMode(false);
    setSelectedModel(null);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Function to get the PNG path from the model path
  const getModelImagePath = (modelPath) => {
    return modelPath.replace(".gltf", ".png");
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed right-8 top-8 z-50 rounded-full w-12 h-12 shadow-xl bg-background/80 backdrop-blur-sm"
        onClick={toggleSidebar}
      >
        <Menu size={24} />
      </Button>

      {/* Model Selector Sidebar */}
      <div
        className={`fixed right-0 top-0 h-auto max-h-[80vh] z-40 transition-all duration-300 ease-in-out mt-28 mr-8 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-[110%]"
        }`}
      >
        <Card className="w-[320px] bg-black/40 backdrop-blur-md border-gray-700 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
          <CardHeader className="pb-3 pt-6 px-6">
            <CardTitle className="text-xl font-semibold text-white">
              Choose a Model
            </CardTitle>
          </CardHeader>

          <CardContent className="px-6 pb-4 space-y-5">
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">
                Categories
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`${
                    selectedCategory === "all"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800/80 text-white hover:bg-gray-700/90"
                  } border-gray-700 rounded-xl py-2 h-auto`}
                  onClick={() => setSelectedCategory("all")}
                >
                  All
                </Button>
                {modelCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant="outline"
                    size="sm"
                    className={`${
                      selectedCategory === category.id
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800/80 text-white hover:bg-gray-700/90"
                    } border-gray-700 rounded-xl py-2 h-auto`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Models</label>
              <ScrollArea className="h-[320px] pr-4">
                <div className="grid grid-cols-1 gap-3">
                  {filteredModels.map((model) => (
                    <div
                      key={model.id}
                      className={`cursor-pointer overflow-hidden rounded-xl border ${
                        selectedModel?.id === model.id
                          ? "border-purple-500 bg-purple-600"
                          : "border-gray-700 bg-gray-800/80 hover:bg-gray-700/90"
                      }`}
                      onClick={() => handleSelectModel(model)}
                      onMouseEnter={() => useGLTF.preload(model.path)}
                    >
                      <div className="flex flex-col">
                        {/* Image container */}
                        <div className="w-full h-32 bg-gray-900/50 flex items-center justify-center p-2">
                          <img
                            src={
                              getModelImagePath(model.path) ||
                              "/placeholder.svg"
                            }
                            alt={model.name}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/placeholder.svg";
                            }}
                          />
                        </div>
                        {/* Model name */}
                        <div
                          className={`p-2 text-center ${selectedModel?.id === model.id ? "text-white" : "text-gray-200"}`}
                        >
                          <span className="text-sm font-medium">
                            {model.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>

          <CardFooter className="px-6 py-4 flex justify-between bg-gray-900/40 border-t border-gray-800">
            {isPlacementMode ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelPlacement}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                Cancel Placement
              </Button>
            ) : (
              <div></div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setisHelpDialogOpen(true)}
              className="bg-gray-800/80 text-white hover:bg-gray-700/90 border-gray-700 rounded-xl"
            >
              Help
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Help Dialog */}
      <Dialog open={isHelpDialogOpen} onOpenChange={setisHelpDialogOpen}>
        <DialogContent className="bg-gray-900/90 backdrop-blur-md text-white border-gray-700 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Placement Controls</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600/20 p-2 rounded-full">
                <MousePointerClick className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium">Place Blocks</h4>
                <p className="text-sm text-gray-400">
                  Click to place the selected block in your world
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-purple-600/20 p-2 rounded-full">
                <Rotate3D className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium">Rotate Blocks</h4>
                <p className="text-sm text-gray-400">
                  Press R key to rotate the block before placement
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-purple-600/20 p-2 rounded-full">
                <X className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium">Cancel Placement</h4>
                <p className="text-sm text-gray-400">
                  Press ESC to exit placement mode
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
