import React from "react";
import { useRoom } from "./RoomContext";

export function SaveSystem() {
  const { placedModels, updateAllModels } = useRoom();

  const handleSave = () => {
    const saveData = {
      version: "1.0",
      timestamp: Date.now(),
      placedModels: placedModels,
    };

    // Convert to JSON and save
    const saveString = JSON.stringify(saveData);

    // For browser storage
    localStorage.setItem("roomDesign", saveString);

    // For File Download
    const blob = new Blob([saveString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `room-design-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("Room design saved!");
  };

  const handleLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loadedData = JSON.parse(event.target.result);
        if (loadedData && loadedData.placedModels) {
          updateAllModels(loadedData.placedModels);
          alert("Room design loaded successfully!");
        }
      } catch (error) {
        console.error("Failed to parse save file:", error);
        alert("Invalid save file format");
      }
    };
    reader.readAsText(file);
  };

  // Load from local storage on component mount
  React.useEffect(() => {
    const savedDesign = localStorage.getItem("roomDesign");
    if (savedDesign) {
      try {
        const loadedData = JSON.parse(savedDesign);
        if (loadedData && loadedData.placedModels) {
          updateAllModels(loadedData.placedModels);
        }
      } catch (e) {
        console.error("Failed to load saved design:", e);
      }
    }
  }, [updateAllModels]);

  return (
    <div className="save-system-ui">
      <button onClick={handleSave} className="save-btn">
        Save Room
      </button>

      <div className="load-container">
        <label htmlFor="load-file" className="load-btn">
          Load Room
        </label>
        <input
          type="file"
          id="load-file"
          accept=".json"
          onChange={handleLoad}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
