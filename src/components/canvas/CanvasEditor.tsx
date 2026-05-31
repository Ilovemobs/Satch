"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from "react";
import { Canvas, Rect, Ellipse, Line, Textbox, PencilBrush } from "fabric";

type Tool = "brush" | "eraser" | "rect" | "circle" | "line" | "text";

export const CanvasEditor = forwardRef<{ getData: () => string; getThumbnail: () => string }>(
  function CanvasEditor(_props, ref) {
    const canvasEl = useRef<HTMLCanvasElement>(null);
    const canvasRef = useRef<Canvas | null>(null);
    const [tool, setTool] = useState<Tool>("brush");
    const [color, setColor] = useState("#ffffff");
    const [brushSize, setBrushSize] = useState(4);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const saveState = useCallback(() => {
      if (!canvasRef.current) return;
      const json = JSON.stringify(canvasRef.current.toJSON());
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(json);
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    }, [historyIndex]);

    useEffect(() => {
      if (!canvasEl.current) return;

      const canvas = new Canvas(canvasEl.current, {
        width: 800,
        height: 600,
        backgroundColor: "#18181b",
        isDrawingMode: true,
        preserveObjectStacking: true,
      });

      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = color;

      canvas.on("path:created", saveState);
      canvas.on("object:modified", saveState);

      canvasRef.current = canvas;
      saveState();

      return () => {
        canvas.dispose();
      };
    }, []);

    useEffect(() => {
      if (!canvasRef.current) return;
      const brush = canvasRef.current.freeDrawingBrush;
      if (brush) {
        brush.width = brushSize;
        brush.color = color;
      }
    }, [brushSize, color]);

    useEffect(() => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.isDrawingMode = tool === "brush" || tool === "eraser";

      if (tool === "eraser") {
        const brush = canvas.freeDrawingBrush;
        if (brush) {
          brush.color = "#18181b";
          brush.width = brushSize * 2;
        }
      } else if (tool === "brush") {
        const brush = canvas.freeDrawingBrush;
        if (brush) {
          brush.color = color;
          brush.width = brushSize;
        }
      }
    }, [tool, color, brushSize]);

    function addShape(shape: "rect" | "circle" | "line") {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      let obj;

      if (shape === "rect") {
        obj = new Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 80,
          fill: color,
          stroke: "#ffffff",
          strokeWidth: 1,
        });
      } else if (shape === "circle") {
        obj = new Ellipse({
          left: 100,
          top: 100,
          rx: 50,
          ry: 50,
          fill: color,
          stroke: "#ffffff",
          strokeWidth: 1,
        });
      } else {
        obj = new Line([100, 100, 300, 200], {
          stroke: color,
          strokeWidth: brushSize,
        });
      }

      canvas.add(obj);
      canvas.setActiveObject(obj);
      saveState();
    }

    function addText() {
      if (!canvasRef.current) return;
      const text = new Textbox("Type here", {
        left: 100,
        top: 100,
        width: 200,
        fontSize: 32,
        fill: color,
        fontFamily: "sans-serif",
      });
      canvasRef.current.add(text);
      canvasRef.current.setActiveObject(text);
      saveState();
    }

    function undo() {
      if (historyIndex <= 0) return;
      const newIndex = historyIndex - 1;
      const json = history[newIndex];
      if (json && canvasRef.current) {
        canvasRef.current.loadFromJSON(JSON.parse(json)).then(() => {
          canvasRef.current?.requestRenderAll();
        });
        setHistoryIndex(newIndex);
      }
    }

    function redo() {
      if (historyIndex >= history.length - 1) return;
      const newIndex = historyIndex + 1;
      const json = history[newIndex];
      if (json && canvasRef.current) {
        canvasRef.current.loadFromJSON(JSON.parse(json)).then(() => {
          canvasRef.current?.requestRenderAll();
        });
        setHistoryIndex(newIndex);
      }
    }

    function clearCanvas() {
      if (!canvasRef.current) return;
      canvasRef.current.clear();
      canvasRef.current.backgroundColor = "#18181b";
      canvasRef.current.requestRenderAll();
      saveState();
    }

    useImperativeHandle(ref, () => ({
      getData() {
        return canvasRef.current ? JSON.stringify(canvasRef.current.toJSON()) : "";
      },
      getThumbnail() {
        return canvasRef.current ? canvasRef.current.toDataURL({ format: "png", multiplier: 0.3 }) : "";
      },
    }));

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-zinc-900">
          <ToolButton active={tool === "brush"} onClick={() => setTool("brush")} label="Brush" />
          <ToolButton active={tool === "eraser"} onClick={() => setTool("eraser")} label="Eraser" />
          <ToolButton active={false} onClick={() => { setTool("rect"); addShape("rect"); }} label="Rect" />
          <ToolButton active={false} onClick={() => { setTool("circle"); addShape("circle"); }} label="Circle" />
          <ToolButton active={false} onClick={() => { setTool("line"); addShape("line"); }} label="Line" />
          <ToolButton active={false} onClick={() => { setTool("text"); addText(); }} label="Text" />

          <div className="h-6 w-px bg-zinc-700 mx-1" />

          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border border-zinc-700 bg-transparent"
            title="Color"
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{brushSize}px</span>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-20 accent-amber-500"
            />
          </div>

          <div className="h-6 w-px bg-zinc-700 mx-1" />

          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="rounded px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
            title="Undo"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="rounded px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100 disabled:opacity-30"
            title="Redo"
          >
            Redo
          </button>
          <button
            onClick={clearCanvas}
            className="rounded px-2 py-1 text-xs text-red-400 hover:text-red-300"
            title="Clear"
          >
            Clear
          </button>
        </div>

        <div className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
          <canvas ref={canvasEl} />
        </div>
      </div>
    );
  }
);

function ToolButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-amber-600 text-white"
          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
      }`}
    >
      {label}
    </button>
  );
}
