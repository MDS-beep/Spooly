import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "/api";

const Input = (props) => (
  <input
    {...props}
    className={
      "w-full border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-purple-400 dark:bg-gray-800 dark:text-white " +
      (props.className || "")
    }
  />
);

const TextArea = (props) => (
  <textarea
    {...props}
    rows={3}
    className={
      "w-full border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-purple-400 dark:bg-gray-800 dark:text-white resize-none " +
      (props.className || "")
    }
  />
);

const Button = ({ children, variant, ...props }) => {
  const base =
    "px-4 py-2 rounded font-semibold transition-colors duration-200 ";
  const variants = {
    outline:
      "border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-400 dark:hover:text-black",
    solid:
      "bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-400 dark:hover:bg-purple-500",
  };
  return (
    <button
      {...props}
      className={base + (variants[variant] || variants.solid) + (props.className || "")}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className }) => (
  <div
    className={
      "border rounded shadow-sm bg-white dark:bg-gray-800 dark:text-white " +
      (className || "")
    }
  >
    {children}
  </div>
);

const CardContent = ({ children, className }) => (
  <div className={"p-4 " + (className || "")}>{children}</div>
);

const Modal = ({ isOpen, onClose, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-lg w-full shadow-lg max-h-[90vh] overflow-auto"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const getBrightness = (hexColor) => {
  if (!hexColor) return 0;
  let c = hexColor.trim();
  if (c[0] === "#") c = c.slice(1);
  if (c.length === 3)
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

const FilamentSpoolGraph = ({ percent, color }) => {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const heightPx = 120;
  const fillHeight = (heightPx * clampedPercent) / 100;

  const brightness = getBrightness(color);
  const useBlackSpool = brightness > 125;
  const imageSrc = useBlackSpool ? "/spool-black.png" : "/spool-white.png";

  return (
    <div style={{ position: "relative", width: 120, height: heightPx }}>
      {/* Solid color fill without any brightness/filter or transparency */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: fillHeight,
          backgroundColor: color || "#8884d8",
          borderRadius: 8,
          transition: "height 0.5s ease",
          zIndex: 0,
          filter: "brightness(0.9)"
        }}
      />
      <img
        src={imageSrc}
        alt="Filament Spool"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          pointerEvents: "none",
          userSelect: "none",
          filter: !useBlackSpool ? "brightness(0.85)" : "none",
        }}
        onError={() => console.warn(`Failed to load ${imageSrc}`)}
      />
    </div>
  );
};


const EditableField = ({
  label,
  value,
  onChange,
  isTextArea = false,
  onEnterSubmit,
  placeholder,
}) => {
  const [editingValue, setEditingValue] = useState(value);

  useEffect(() => {
    setEditingValue(value);
  }, [value]);

  const submit = () => {
    if (editingValue !== value) onChange(editingValue);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !isTextArea) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <label className="block mb-3 w-full">
      <div className="font-semibold mb-1">{label}</div>
      {isTextArea ? (
        <TextArea
          placeholder={placeholder}
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={submit}
        />
      ) : (
        <Input
          placeholder={placeholder}
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={submit}
          onKeyDown={onKeyDown}
        />
      )}
    </label>
  );
};


const App = () => {
  const [filaments, setFilaments] = useState([]);
  const [form, setForm] = useState({
    name: "",
    brand: "",
    notes: "",
    copies: 1,
    color: "#8884d8",
    material: "",
    startMass: 1000,
    currentMass: 1000,
  });
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("spooly-dark") === "true"
  );
  const [showIntro, setShowIntro] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [useFilamentId, setUseFilamentId] = useState(null);
  const [moreInfoId, setMoreInfoId] = useState(null);
  const [usedMassInput, setUsedMassInput] = useState("");

  useEffect(() => {
    fetch(API_BASE + "/filaments")
      .then((res) => res.json())
      .then((data) => setFilaments(data))
      .catch(() => setFilaments([]));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("spooly-dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const addFilament = () => {
    if (!form.name.trim()) {
      alert("Please provide a filament name.");
      return;
    }
    const newItem = {
      ...form,
      currentMass: form.startMass,
    };
    fetch(API_BASE + "/filaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    })
      .then((res) => res.json())
      .then((saved) => {
        setFilaments([saved, ...filaments]);
        setForm({
          name: "",
          brand: "",
          notes: "",
          copies: 1,
          color: "#8884d8",
          material: "",
          startMass: 1000,
          currentMass: 1000,
        });
        setShowAddModal(false);
      });
  };

  const updateFilament = (id, data) => {
    fetch(`${API_BASE}/filaments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Update failed");
        return res.json();
      })
      .then((updated) => {
        setFilaments((old) =>
          old.map((f) => (f.id === updated.id ? updated : f))
        );
      });
  };

  const deleteFilament = (id) => {
    fetch(`${API_BASE}/filaments/${id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Delete failed");
        setFilaments((old) => old.filter((f) => f.id !== id));
        setMoreInfoId(null);
      })
      .catch(() => alert("Failed to delete filament"));
  };

  const updateMass = (id, usedMass) => {
    if (isNaN(usedMass) || usedMass <= 0) return;
    const filament = filaments.find((f) => f.id === id);
    if (!filament) return;
    const newMass = Math.max(0, filament.currentMass - usedMass);
    updateFilament(id, { currentMass: newMass });
    setUseFilamentId(null);
    setUsedMassInput("");
  };

  const handleImport = (e) => {
    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) throw new Error("Invalid data");
        fetch(`${API_BASE}/filaments/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(imported),
        }).then(() => {
          setFilaments(imported);
          setShowSettingsModal(false);
        });
      } catch {
        alert("Invalid JSON file");
      }
    };
    fileReader.readAsText(e.target.files[0]);
  };

  const handleExport = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(filaments));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "filaments.json");
    dlAnchorElem.click();
  };

  const isEmpty = (f) => f.currentMass <= 0;

  const filtered = filaments.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.brand.toLowerCase().includes(search.toLowerCase()) ||
      f.material.toLowerCase().includes(search.toLowerCase())
  );

  // Split empty and non-empty
  const empties = filtered.filter(isEmpty);
  const nonEmpties = filtered.filter((f) => !isEmpty(f));

  const currentMoreInfo = filaments.find((f) => f.id === moreInfoId);
  const currentUseFilament = filaments.find((f) => f.id === useFilamentId);

  return (
    <div className="p-4 space-y-4 bg-white dark:bg-gray-900 text-black dark:text-white min-h-screen">
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.h1
              className="text-5xl font-extrabold tracking-wider text-purple-600 dark:text-purple-400"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 120 }}
            >
              Spooly
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Spooly - Filament Tracker</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowAddModal(true)}>
            Add Filament
          </Button>
          <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
            Settings
          </Button>
        </div>
      </div>

      <Input
        placeholder="Search filaments... (Name, Brand, Material)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Non-empty filaments */}
      <h2 className="text-xl mt-6">Available Filaments</h2>
      {nonEmpties.length === 0 && <p>No available filaments.</p>}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {nonEmpties.map((f) => {
          const percentLeft = f.startMass
            ? (f.currentMass / f.startMass) * 100
            : 0;
          return (
            <Card
              key={f.id}
              className="dark:bg-gray-800 flex flex-col items-center"
              style={{ maxWidth: 200 }}
            >
              <CardContent className="space-y-2 flex flex-col items-center">
                <div className="w-[120px] h-[120px]">
                  <FilamentSpoolGraph
                    percent={percentLeft}
                    color={f.color || "#8884d8"}
                  />
                </div>
                <div className="text-center font-semibold">{f.name}</div>
                <div className="text-center text-sm">Brand: {f.brand || "-"}</div>
                <div className="text-center text-sm">
                  Material: {f.material || "-"}
                </div>
                <div className="text-center text-sm">
                  Current Mass: {f.currentMass.toFixed(2)} g
                </div>
              </CardContent>

              {/* Centered buttons below spool */}
              <div className="flex justify-center space-x-4 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMoreInfoId(f.id)}
                >
                  More Info
                </Button>
                <Button variant="solid" onClick={() => setUseFilamentId(f.id)}>
                  Use Filament
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty filaments */}
      <h2 className="text-xl mt-10">Empty Filaments</h2>
      {empties.length === 0 && <p>No empty filaments.</p>}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {empties.map((f) => {
          // Show graph as 100% full if empty
          return (
            <Card
              key={f.id}
              className="dark:bg-gray-800 flex flex-col items-center"
              style={{ maxWidth: 200 }}
            >
              <CardContent className="space-y-2 flex flex-col items-center">
                <div className="w-[120px] h-[120px]">
                  <FilamentSpoolGraph
                    percent={100}
                    color={f.color || "#8884d8"}
                  />
                </div>
                <div className="text-center font-semibold">{f.name}</div>
                <div className="text-center text-sm">Brand: {f.brand || "-"}</div>
                <div className="text-center text-sm">
                  Material: {f.material || "-"}
                </div>
                <div className="text-center text-sm">
                  Current Mass: {f.currentMass.toFixed(2)} g
                </div>
              </CardContent>

              <div className="flex justify-center space-x-4 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMoreInfoId(f.id)}
                >
                  More Info
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Filament Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <h2 className="text-2xl font-bold mb-4">Add New Filament</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className="block w-full">
            <div className="mb-1 font-semibold">Name</div>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="block w-full">
            <div className="mb-1 font-semibold">Brand</div>
            <Input
              value={form.Brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </label>
          <label className="block w-full">
            <div className="mb-1 font-semibold">Color</div>
            <Input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="p-0 w-16 h-10"
            />
          </label>
          <label className="block w-full">
            <div className="mb-1 font-semibold">Material</div>
            <Input
              value={form.Material}
              onChange={(e) => setForm({ ...form, material: e.target.value })}
            />
          </label>
          <label className="block w-full">
            <div className="mb-1 font-semibold">Start Mass (grams)</div>
            <Input
              type="number"
              value={form.startMass}
              onChange={(e) =>
                setForm({ ...form, startMass: Number(e.target.value) })
              }
            />
          </label>
          <label className="block w-full">
            <div className="mb-1 font-semibold">Copies</div>
            <Input
              type="number"
              min={1}
              value={form.copies}
              onChange={(e) => setForm({ ...form, copies: Number(e.target.value) })}
            />
          </label>
          <label className="block w-full col-span-2">
            <div className="mb-1 font-semibold">Notes</div>
            <TextArea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <Button variant="outline" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button onClick={addFilament}>Add</Button>
        </div>
      </Modal>

      {/* Use Filament Modal */}
      <Modal isOpen={!!useFilamentId} onClose={() => setUseFilamentId(null)}>
        <h2 className="text-2xl font-bold mb-4">Use Filament</h2>
        {currentUseFilament ? (
          <>
            <div className="mb-3">
              <strong>{currentUseFilament.name}</strong>
            </div>
            <Input
              type="number"
              placeholder="Grams used"
              value={usedMassInput}
              onChange={(e) => setUsedMassInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateMass(useFilamentId, Number(usedMassInput));
                }
              }}
            />
            <div className="mt-6 flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setUseFilamentId(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateMass(useFilamentId, Number(usedMassInput))}
              >
                Update
              </Button>
            </div>
          </>
        ) : (
          <p>Filament not found.</p>
        )}
      </Modal>

      {/* More Info Modal */}
      <Modal isOpen={!!moreInfoId} onClose={() => setMoreInfoId(null)}>
        <h2 className="text-2xl font-bold mb-4">More Info</h2>
        {currentMoreInfo ? (
          <div className="space-y-3 w-full flex flex-col">
            <EditableField
              label="Name"
              value={currentMoreInfo.name}
              onChange={(v) => updateFilament(moreInfoId, { name: v })}
            />
            <EditableField
              label="Brand"
              value={currentMoreInfo.brand}
              onChange={(v) => updateFilament(moreInfoId, { brand: v })}
            />
            <EditableField
              label="Material"
              value={currentMoreInfo.material}
              onChange={(v) => updateFilament(moreInfoId, { material: v })}
            />
            <div>
              <label className="block font-semibold mb-1">Color</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="color"
                  value={currentMoreInfo.color || "#8884d8"}
                  onChange={(e) =>
                    updateFilament(moreInfoId, { color: e.target.value })
                  }
                  style={{ width: 40, height: 40, padding: 0, borderRadius: 4 }}
                  className="p-0"
                />
                <Input
                  type="text"
                  value={currentMoreInfo.color || "#8884d8"}
                  onChange={(e) =>
                    updateFilament(moreInfoId, { color: e.target.value })
                  }
                  placeholder="#rrggbb"
                  className="flex-grow"
                />
              </div>
            </div>
            <EditableField
              label="Start Mass (grams)"
              value={currentMoreInfo.startMass}
              onChange={(v) => {
                const num = Number(v);
                if (!isNaN(num) && num >= 0) {
                  updateFilament(moreInfoId, { startMass: num });
                }
              }}
            />
            <EditableField
              label="Current Mass (grams)"
              value={currentMoreInfo.currentMass}
              onChange={(v) => {
                const num = Number(v);
                if (!isNaN(num) && num >= 0) {
                  updateFilament(moreInfoId, { currentMass: num });
                }
              }}
            />
            <EditableField
              label="Notes"
              value={currentMoreInfo.notes}
              onChange={(v) => updateFilament(moreInfoId, { notes: v })}
              isTextArea
            />
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setMoreInfoId(null)}>
                Close
              </Button>
              <Button
                variant="solid"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete filament "${currentMoreInfo.name}"? This action cannot be undone.`
                    )
                  ) {
                    deleteFilament(moreInfoId);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <p>Filament not found.</p>
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)}>
        <h2 className="text-2xl font-bold mb-4">Settings & Data Import/Export</h2>
        <div className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Dark Mode</label>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Import Filaments (JSON)</label>
            <input type="file" accept=".json" onChange={handleImport} />
          </div>
          <div>
            <Button onClick={handleExport}>Export Filaments</Button>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default App;
