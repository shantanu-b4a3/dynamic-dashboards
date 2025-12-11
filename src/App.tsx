import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  DragOverlay,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import photos from "./photos.json";
import { Photo } from "./Photo";
import { SortablePhoto } from "./SortablePhoto";
import { Grid } from "./Grid";

const UploadGallery = () => {
  const [items, setItems] = useState(photos);
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  return (
    <>
      <button onClick={() => {
        setItems((prev:any) => {
          return [...prev, "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTr20qcJQtRgnl_vghY71zfYsvwEMlAa-qSIJtYhE0GyyCo0vyLfK2oOKSgl_ff2knZQs&usqp=CAU"]
        })
      }}>Add Image</button>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <Grid columns={4}>
            {items.map((url, index) => (
              <SortablePhoto key={index} url={url} index={index} />
            ))}
          </Grid>
        </SortableContext>

        <DragOverlay adjustScale={true}>
          {activeId ? (
            <Photo url={activeId} index={items.indexOf(activeId)} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );

  function handleDragStart(event: any) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items: any) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  }

  function handleDragCancel() {
    setActiveId(null);
  }
};

export default UploadGallery;
