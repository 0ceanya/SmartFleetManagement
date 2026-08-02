"use client";

import React, { useEffect, useRef, useState } from "react";

const DEFAULT_SNAP_POINTS = [0.16, 0.5, 0.9];
const DRAG_CLICK_THRESHOLD_PX = 6;

export default function DriverBottomSheet({ snapPoints = DEFAULT_SNAP_POINTS, initialSnap = 0, children }) {
  const [viewportHeight, setViewportHeight] = useState(800);
  const [snapIndex, setSnapIndex] = useState(initialSnap);
  const [dragHeight, setDragHeight] = useState(null);
  const dragState = useRef(null);

  useEffect(() => {
    function updateViewportHeight() {
      setViewportHeight(window.innerHeight);
    }
    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    return () => window.removeEventListener("resize", updateViewportHeight);
  }, []);

  const snapHeightsPx = snapPoints.map((fraction) => fraction * viewportHeight);
  const currentHeight = dragHeight ?? snapHeightsPx[snapIndex];

  const nearestSnapIndex = (heightPx) => {
    let closestIndex = 0;
    let closestDistance = Infinity;
    snapHeightsPx.forEach((h, index) => {
      const distance = Math.abs(h - heightPx);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    return closestIndex;
  };

  const handlePointerDown = (e) => {
    dragState.current = {
      startY: e.clientY,
      startHeight: snapHeightsPx[snapIndex],
      moved: false,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragState.current) return;
    const delta = dragState.current.startY - e.clientY;
    if (Math.abs(delta) > DRAG_CLICK_THRESHOLD_PX) dragState.current.moved = true;
    const min = snapHeightsPx[0];
    const max = snapHeightsPx[snapHeightsPx.length - 1];
    const next = Math.min(max, Math.max(min, dragState.current.startHeight + delta));
    setDragHeight(next);
  };

  const handlePointerUp = () => {
    if (!dragState.current) return;
    if (!dragState.current.moved) {
      setSnapIndex((index) => (index + 1) % snapHeightsPx.length);
    } else if (dragHeight !== null) {
      setSnapIndex(nearestSnapIndex(dragHeight));
    }
    dragState.current = null;
    setDragHeight(null);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 bg-white border-t border-gray-300 shadow-2xl flex flex-col"
      style={{ height: `${currentHeight}px`, transition: dragHeight === null ? "height 0.2s ease-out" : "none" }}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full flex items-center justify-center py-2.5 cursor-grab active:cursor-grabbing touch-none shrink-0"
      >
        <span className="block h-1.5 w-12 rounded-full bg-gray-300" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6 sm:px-6">{children}</div>
    </div>
  );
}
