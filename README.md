# 🎯 DnD 拖拽技术学习项目

这是一个深入学习前端拖拽技术的实践项目，涵盖了三种主流的拖拽实现方案，从底层原理到最佳实践，提供了完整的学习路径和技术对比。

## 📚 项目概述

本项目系统性地探索了前端拖拽技术的三种核心实现方案：

1. **HTML5 Drag & Drop API** - 原生标准，功能强大
2. **Mouse/Touch Events** - 手动实现，完全可控
3. **Pointer Events** - 现代统一 API，兼容性最佳

每种方案都包含完整的演示、详细的注释，以及实际业务场景的应用案例。

## 🗂️ 项目结构

```
dnd-learning/
├── html5-dnd/              # HTML5 Drag & Drop API 实现
│   ├── index.html          # 演示页面 - 支持拖拽移动和排序
│   ├── index.js            # 完整功能实现 (756行代码)
│   └── index.css           # 样式文件
├── mouse-touch/            # Mouse/Touch Events 手动实现
│   ├── index.html          # 演示页面 - 双端兼容设计
│   ├── index.js            # 手动拖拽实现 (333行代码)
│   └── index.css           # 样式文件
├── pointer-events/         # Pointer Events 现代实现
│   ├── index.html          # 基础演示页面
│   ├── index.js            # 基础实现 (439行代码)
│   ├── demo-oop.html       # 面向对象封装演示
│   ├── PointerDragDrop.js  # 拖拽库封装 (814行代码)
│   └── index.css           # 样式文件
└── index.html              # 项目首页导航
```

## 🔧 三种实现方案详解

### 1. HTML5 Drag & Drop API

**特点：**
- 🌐 浏览器原生支持，标准化程度高
- 🎯 事件模型完整：`dragstart`、`dragover`、`drop` 等
- 🔄 内置数据传输机制：`DataTransfer` 对象
- ✅ 支持文件拖拽、跨应用拖拽

**核心实现：**
```javascript
// 设置拖拽元素
element.draggable = true;
element.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', data);
    e.dataTransfer.effectAllowed = 'move';
});

// 设置放置区域
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault(); // 关键：允许放置
    e.dataTransfer.dropEffect = 'move';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    // 处理放置逻辑
});
```

**优势：**
- 📱 语义清晰，符合 Web 标准
- 🔄 事件流完整，便于理解和调试
- 🎨 浏览器提供默认视觉反馈
- 📋 支持复杂的拖拽排序逻辑

**限制：**
- 📱 移动端支持有限（iOS Safari 几乎不可用）
- 🎨 样式定制受限
- 🐛 跨浏览器兼容性问题较多

**项目实现亮点：**
- ✅ **真正的移动语义**：`effectAllowed='move'` 后自动删除原始元素
- 🔄 **双向拖拽**：支持从状态区域拖回原始区域
- 📋 **智能排序**：同容器内拖拽触发排序，跨容器拖拽触发移动
- 🎯 **平滑动画**：使用 `transform` 和 `requestAnimationFrame` 优化性能

### 2. Mouse/Touch Events 手动实现

**特点：**
- 🎯 完全自主控制，灵活性最高
- 📱 原生支持移动端触摸
- ⚡ 性能可控，便于优化
- 🔧 可实现复杂的交互逻辑

**核心实现：**
```javascript
// 统一的坐标获取函数
function getEventCoords(e) {
    if (e.type.startsWith('touch')) {
        const touch = e.touches[0] || e.changedTouches[0];
        return { clientX: touch.clientX, clientY: touch.clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
}

// 拖拽开始
element.addEventListener('mousedown', handleDragStart);
element.addEventListener('touchstart', handleDragStart);

function handleDragStart(e) {
    e.preventDefault();
    dragState.isDragging = true;
    dragState.dragElement = element;
    
    // 计算偏移量
    const coords = getEventCoords(e);
    const rect = element.getBoundingClientRect();
    dragState.offsetX = coords.clientX - rect.left;
    dragState.offsetY = coords.clientY - rect.top;
    
    // 添加全局移动监听
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove);
}
```

**优势：**
- 📱 移动端和桌面端体验一致
- 🎨 UI 效果完全可定制
- ⚡ 可使用节流等性能优化技巧
- 🔧 支持多点触控等高级功能

**挑战：**
- 🐛 需要处理更多边界情况
- 📝 代码量相对较大
- 🔄 需要手动管理状态

**项目实现亮点：**
- 📊 **实时统计**：拖拽次数、移动事件数、触摸支持检测
- ⚡ **性能优化**：使用 `throttle` 函数优化移动事件，`requestAnimationFrame` 优化动画
- 📱 **设备兼容**：自动检测触摸支持，统一处理鼠标和触摸事件
- 🔄 **双端适配**：同时支持桌面端鼠标和移动端触摸操作

### 3. Pointer Events 现代实现

**特点：**
- 🎯 统一 API，处理所有输入设备（鼠标、触摸、笔）
- 🔒 指针捕获机制，确保事件不丢失
- 📱 移动端支持更好
- ⚡ 浏览器原生优化

**核心实现：**
```javascript
// 指针按下
element.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    dragState.pointerId = e.pointerId;
    
    // 设置指针捕获（关键特性）
    element.setPointerCapture(e.pointerId);
    
    // 添加后续事件监听
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
});

function handlePointerMove(e) {
    if (e.pointerId !== dragState.pointerId) return;
    
    // 使用 requestAnimationFrame 优化性能
    requestAnimationFrame(() => {
        updateDragPosition(e);
    });
}

function handlePointerUp(e) {
    // 释放指针捕获
    element.releasePointerCapture(e.pointerId);
}
```

**优势：**
- 🎯 一套代码处理所有输入设备
- 🔒 `setPointerCapture` 确保拖拽过程中事件不丢失
- 📱 更好的移动端和触摸屏支持
- 🖊️ 支持压感笔等高级输入设备

**项目实现亮点：**
- 📊 **指针跟踪**：实时显示活跃指针信息（类型、坐标、压力值）
- 🔒 **指针捕获**：使用 `setPointerCapture` 确保拖拽稳定性
- 🎯 **设备识别**：区分鼠标、触摸、笔等不同输入设备
- 🏗️ **面向对象封装**：`PointerDragDrop` 类提供类似 HTML5 DnD 的 API

## 🏗️ 面向对象拖拽库设计

项目中的 `PointerDragDrop.js` 是一个完整的拖拽库，提供了类似 HTML5 Drag & Drop 的 API：

```javascript
// 创建拖拽实例
const dragDrop = new PointerDragDrop();

// 设置拖拽元素
dragDrop.makeDraggable(element);

// 设置放置区域
dragDrop.makeDropZone(dropZone);

// 设置排序容器
dragDrop.makeSortable(container);

// 监听事件（类似 HTML5 DnD）
dragDrop.on('dragstart', handler);
dragDrop.on('dragover', handler);
dragDrop.on('drop', handler);
dragDrop.on('sortcomplete', handler);
```

**库特性：**
- 🎯 **API 一致性**：模仿 HTML5 DnD API 设计
- 📱 **移动端优化**：基于 Pointer Events，完美支持触摸
- 🔄 **智能排序**：自动区分排序和移动操作
- 🎨 **动画支持**：平滑的排序动画和视觉反馈
- ⚡ **性能优化**：使用 `requestAnimationFrame` 和事件节流

## 📋 功能特性对比

| 特性 | HTML5 DnD | Mouse/Touch | Pointer Events |
|------|-----------|-------------|----------------|
| **桌面端支持** | ✅ 优秀 | ✅ 优秀 | ✅ 优秀 |
| **移动端支持** | ❌ 很差 | ✅ 优秀 | ✅ 优秀 |
| **开发复杂度** | 🟡 中等 | 🔴 较高 | 🟢 较低 |
| **性能** | 🟡 中等 | 🟢 优秀 | ✅ 优秀 |
| **浏览器支持** | 🟡 兼容性问题 | ✅ 广泛支持 | 🟡 现代浏览器 |
| **代码量** | 🟡 中等 | 🔴 较多 | 🟢 较少 |
| **定制性** | 🔴 受限 | ✅ 完全可控 | ✅ 较好 |
| **学习成本** | 🟢 较低 | 🔴 较高 | 🟡 中等 |

## 💡 核心技术点和最佳实践

### 1. 事件处理优化

**性能优化技巧：**
```javascript
// 使用节流优化高频事件
const handleDragMove = throttle(function(e) {
    updatePosition(e);
}, 16); // 约60fps

// 使用 requestAnimationFrame 优化动画
function updateDragPosition(e) {
    requestAnimationFrame(() => {
        element.style.left = e.clientX + 'px';
        element.style.top = e.clientY + 'px';
    });
}
```

### 2. 移动端兼容性处理

**关键设置：**
```css
/* 禁用默认触摸行为 */
.draggable-item {
    touch-action: none;
    user-select: none;
}
```

```javascript
// 统一事件处理
function getEventCoords(e) {
    if (e.type.startsWith('touch')) {
        const touch = e.touches[0] || e.changedTouches[0];
        return { clientX: touch.clientX, clientY: touch.clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
}
```

### 3. 排序算法优化

**智能排序逻辑：**
```javascript
function getInsertPosition(container, y) {
    const items = [...container.querySelectorAll('.item:not(.dragging)')];
    
    for (let i = 0; i < items.length; i++) {
        const rect = items[i].getBoundingClientRect();
        const itemCenterY = rect.top + rect.height / 2;
        
        if (y < itemCenterY) {
            return i;
        }
    }
    
    return items.length;
}
```

### 4. 平滑动画实现

**FLIP 动画技术：**
```javascript
function moveElementToPosition(element, newIndex) {
    // First: 记录初始位置
    const initialPos = element.getBoundingClientRect();
    
    // Last: 移动到最终位置
    container.insertBefore(element, container.children[newIndex]);
    const finalPos = element.getBoundingClientRect();
    
    // Invert: 计算差值并设置到初始位置
    const deltaX = initialPos.left - finalPos.left;
    const deltaY = initialPos.top - finalPos.top;
    
    element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    
    // Play: 动画到最终位置
    requestAnimationFrame(() => {
        element.style.transition = 'transform 0.3s ease';
        element.style.transform = 'translate(0, 0)';
    });
}
```

## 🎯 学习重点和技能要点

### 1. 事件机制理解
- **事件冒泡和捕获**：理解 DOM 事件流
- **preventDefault() 的重要性**：特别是在 `dragover` 事件中
- **事件委托**：处理动态添加的元素

### 2. 坐标系统和几何计算
- **ClientX/Y vs PageX/Y**：不同坐标系的应用场景
- **getBoundingClientRect()**：获取元素位置信息
- **触摸事件坐标处理**：`touches` 和 `changedTouches`

### 3. 性能优化策略
- **节流和防抖**：优化高频事件处理
- **requestAnimationFrame**：优化动画性能
- **虚拟滚动**：处理大量元素的拖拽

### 4. 移动端适配技巧
- **touch-action 属性**：控制触摸行为
- **用户选择禁用**：`user-select: none`
- **视口设置**：`viewport` meta 标签配置

## 🚀 实际应用场景

### 1. 任务管理系统
- **看板拖拽**：类似 Trello 的卡片移动
- **优先级调整**：拖拽改变任务优先级
- **状态流转**：通过拖拽改变任务状态

### 2. 文件管理器
- **文件移动**：拖拽文件到不同文件夹
- **批量操作**：多选拖拽
- **预览功能**：拖拽过程中显示文件信息

### 3. 表单构建器
- **组件拖拽**：从工具栏拖拽表单组件
- **布局调整**：拖拽调整组件位置
- **配置面板**：拖拽时显示属性配置

### 4. 图表和数据可视化
- **数据点操作**：拖拽调整图表数据
- **布局调整**：拖拽改变图表位置和大小
- **交互探索**：拖拽进行数据钻取

## ⚠️ 开发注意事项

### 1. HTML5 DnD 使用注意
```javascript
// ❌ 错误：忘记阻止默认行为
dropZone.addEventListener('dragover', (e) => {
    // 缺少 e.preventDefault() 将导致无法放置
});

// ✅ 正确：必须阻止默认行为
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault(); // 关键！
    e.dataTransfer.dropEffect = 'move';
});
```

### 2. 移动端事件处理
```javascript
// ❌ 错误：忘记设置 passive: false
element.addEventListener('touchmove', handler); // 无法调用 preventDefault()

// ✅ 正确：需要显式设置
element.addEventListener('touchmove', handler, { passive: false });
```

### 3. 内存泄漏防范
```javascript
// ✅ 记得清理事件监听器
function cleanupDragState() {
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchend', handleDragEnd);
}
```

### 4. 浏览器兼容性处理
```javascript
// 检测功能支持
const supportsPointerEvents = 'onpointerdown' in window;
const supportsTouch = 'ontouchstart' in window;

// 优雅降级
if (supportsPointerEvents) {
    // 使用 Pointer Events
} else if (supportsTouch) {
    // 使用 Touch Events
} else {
    // 使用 Mouse Events
}
```

## 🎯 最佳实践总结

### 1. 方案选择指南

**选择 HTML5 DnD 当：**
- 🖥️ 主要针对桌面端应用
- 📋 需要复杂的数据传输
- 🔄 希望使用标准化 API
- 📁 需要支持文件拖拽

**选择 Mouse/Touch 当：**
- 📱 需要完美的移动端支持
- 🎨 需要高度定制的 UI 效果
- ⚡ 对性能有极致要求
- 🔧 需要复杂的交互逻辑

**选择 Pointer Events 当：**
- 🎯 需要统一处理多种输入设备
- 📱 移动端和桌面端同等重要
- 🖊️ 需要支持压感笔等高级设备
- ⚖️ 需要平衡功能和复杂度

### 2. 性能优化建议

```javascript
// 1. 使用节流优化高频事件
const optimizedHandler = throttle(handler, 16); // 60fps

// 2. 使用 transform 代替 left/top
element.style.transform = `translate(${x}px, ${y}px)`;

// 3. 避免频繁的 DOM 查询
const cachedElements = new Map();

// 4. 使用 requestAnimationFrame 优化动画
function updatePosition() {
    requestAnimationFrame(() => {
        // 执行位置更新
    });
}
```

### 3. 用户体验优化

```css
/* 1. 提供清晰的视觉反馈 */
.draggable-item {
    cursor: grab;
    transition: transform 0.2s ease;
}

.draggable-item:hover {
    transform: scale(1.02);
}

.draggable-item.dragging {
    cursor: grabbing;
    opacity: 0.8;
    z-index: 1000;
}

/* 2. 明确的放置区域指示 */
.drop-zone.drag-over {
    border-color: #4CAF50;
    background-color: #e8f5e8;
}
```

## 🔚 总结

这个项目全面覆盖了前端拖拽技术的核心知识点，从基础的事件处理到高级的性能优化，从简单的元素移动到复杂的排序算法。通过三种不同的实现方案，你可以：

1. **深入理解**拖拽技术的底层原理
2. **掌握**不同场景下的最佳实践
3. **学会**移动端和桌面端的适配技巧
4. **了解**现代 Web API 的发展趋势

无论是日常开发中的简单拖拽需求，还是复杂的交互式应用，这个项目都能为你提供完整的解决方案和技术参考。

## 🛠️ React 生态主流 DnD 三方库

在实际的 React 项目开发中，通常会选择成熟的第三方库来快速实现拖拽功能。以下是 React 生态中最受欢迎的几个 DnD 库，它们各有特色和适用场景。

### 1. React DnD

**⭐ 星级**: ★★★★★ (20.7k stars)  
**🏷️ 特色**: 高度抽象的声明式拖拽库，基于 Redux 架构  
**📦 安装**: `npm install react-dnd react-dnd-html5-backend`

#### 技术实现原理

React DnD 采用了高度抽象的设计模式，将拖拽逻辑从组件中分离出来：

```javascript
import { useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';

// 拖拽项组件
function DraggableItem({ id, text }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'ITEM',
    item: { id, text },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div 
      ref={drag} 
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {text}
    </div>
  );
}

// 放置区组件
function DropZone({ onDrop }) {
  const [{ isOver }, drop] = useDrop({
    accept: 'ITEM',
    drop: (item) => onDrop(item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div 
      ref={drop}
      style={{ backgroundColor: isOver ? '#f0f0f0' : 'white' }}
    >
      Drop items here
    </div>
  );
}

// 应用根组件
function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <DraggableItem id="1" text="Drag me" />
      <DropZone onDrop={(item) => console.log('Dropped:', item)} />
    </DndProvider>
  );
}
```

#### 核心架构特点

1. **Backend 系统**: 支持多种后端实现（HTML5、Touch、Test）
2. **Monitor 机制**: 实时监控拖拽状态和位置信息
3. **Hook API**: 基于 React Hooks 的现代 API 设计
4. **Type 系统**: 类型化的拖拽项，支持复杂的拖拽规则

#### 适用场景和优势

**✅ 适用场景：**
- 🏢 复杂的企业级应用
- 📊 需要多种拖拽类型的数据可视化
- 🎯 需要精确控制拖拽行为的场景
- 🧪 需要进行拖拽功能测试的项目

**🌟 核心优势：**
- 📐 高度抽象，逻辑清晰
- 🔄 声明式 API，符合 React 思想
- 🧪 内置测试支持
- 🎨 灵活的自定义预览
- 📱 支持多种输入设备

**⚠️ 注意事项：**
- 📈 学习曲线相对陡峭
- 📦 包体积较大（~50KB）
- 🔧 需要理解 Backend 概念

### 2. @dnd-kit

**⭐ 星级**: ★★★★★ (11.8k stars)  
**🏷️ 特色**: 现代化、轻量级、可访问性优先的拖拽库  
**📦 安装**: `npm install @dnd-kit/core @dnd-kit/sortable`

#### 技术实现原理

@dnd-kit 采用了更现代的架构设计，注重性能和可访问性：

```javascript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';

// 可排序项组件
function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

// 可排序列表组件
function SortableList({ items, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map(id => (
          <SortableItem key={id} id={id}>
            Item {id}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

#### 核心架构特点

1. **传感器系统**: 可配置的输入处理（指针、键盘、触摸）
2. **碰撞检测算法**: 多种内置算法（最近中心点、最近角落等）
3. **变换系统**: 基于 CSS transform 的高性能动画
4. **无障碍支持**: 内置键盘导航和屏幕阅读器支持

#### 适用场景和优势

**✅ 适用场景：**
- 📱 需要优秀移动端体验的应用
- ♿ 需要无障碍支持的产品
- ⚡ 对性能要求较高的场景
- 🎨 需要复杂动画效果的界面

**🌟 核心优势：**
- 🚀 性能优秀，基于 transform
- ♿ 一流的可访问性支持
- 📱 完美的触摸设备支持
- 🎨 丰富的动画和过渡效果
- 📦 模块化设计，按需加载

**⚠️ 注意事项：**
- 📚 文档相对较新，社区资源较少
- 🔧 API 设计较为底层，需要更多配置

### 3. react-beautiful-dnd

**⭐ 星级**: ★★★★★ (32.8k stars)  
**🏷️ 特色**: 专注于列表排序，提供出色的用户体验  
**📦 安装**: `npm install react-beautiful-dnd`

#### 技术实现原理

专门针对列表排序场景优化，提供了开箱即用的美观效果：

```javascript
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function TaskList({ tasks, onReorder }) {
  const handleOnDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Droppable droppableId="tasks">
        {(provided, snapshot) => (
          <ul
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{
              backgroundColor: snapshot.isDraggingOver ? '#f4f4f4' : 'white',
            }}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      backgroundColor: snapshot.isDragging ? '#e8e8e8' : 'white',
                    }}
                  >
                    {task.content}
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

#### 核心架构特点

1. **render props 模式**: 通过函数子组件提供状态和样式控制
2. **物理引擎**: 模拟真实的拖拽物理效果
3. **自动滚动**: 智能的容器自动滚动
4. **多列表支持**: 支持跨列表拖拽

#### 适用场景和优势

**✅ 适用场景：**
- 📋 任务管理系统（如 Trello）
- 📊 仪表板组件排序
- 📝 表单字段重排
- 🎯 简单的拖拽排序需求

**🌟 核心优势：**
- 🎨 出色的默认动画效果
- 📱 良好的移动端支持
- 🎯 专注于排序场景，API 简洁
- 📐 智能的布局计算
- 🔄 自动处理滚动

**⚠️ 注意事项：**
- ⚠️ 项目已进入维护模式，不再积极开发
- 🔒 功能相对固定，扩展性有限
- 📱 对复杂布局支持有限

### 4. react-sortable-hoc

**⭐ 星级**: ★★★☆☆ (10.6k stars)  
**🏷️ 特色**: 轻量级排序库，HOC 模式  
**📦 安装**: `npm install react-sortable-hoc`

#### 技术实现原理

采用高阶组件（HOC）模式，为现有组件添加排序能力：

```javascript
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';

// 可排序的项目组件
const SortableItem = SortableElement(({ value }) => (
  <li className="sortable-item">{value}</li>
));

// 可排序的容器组件
const SortableList = SortableContainer(({ items }) => (
  <ul>
    {items.map((value, index) => (
      <SortableItem
        key={`item-${value.id}`}
        index={index}
        value={value.text}
      />
    ))}
  </ul>
));

// 使用组件
function App() {
  const [items, setItems] = useState([
    { id: 1, text: 'Item 1' },
    { id: 2, text: 'Item 2' },
    { id: 3, text: 'Item 3' },
  ]);

  const onSortEnd = ({ oldIndex, newIndex }) => {
    setItems(arrayMoveImmutable(items, oldIndex, newIndex));
  };

  return (
    <SortableList
      items={items}
      onSortEnd={onSortEnd}
      distance={1} // 防止误触
      helperClass="sortable-helper" // 拖拽时的样式类
    />
  );
}
```

#### 适用场景和优势

**✅ 适用场景：**
- 🎯 简单的列表排序
- 📦 需要轻量级解决方案
- 🔄 需要快速迁移现有组件

**🌟 核心优势：**
- 📦 体积小巧（~15KB）
- 🔧 集成简单
- ⚡ 性能良好

**⚠️ 注意事项：**
- ⚠️ 不再积极维护
- 📱 移动端支持一般
- 🔒 功能相对基础

### 5. framer-motion

**⭐ 星级**: ★★★★★ (22.6k stars)  
**🏷️ 特色**: 强大的动画库，包含拖拽功能  
**📦 安装**: `npm install framer-motion`

#### 技术实现原理

虽然主要是动画库，但提供了优秀的拖拽 API：

```javascript
import { motion, Reorder } from 'framer-motion';

// 基础拖拽
function DraggableBox() {
  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
      dragElastic={0.1}
      whileDrag={{ scale: 1.1 }}
      className="draggable-box"
    >
      Drag me!
    </motion.div>
  );
}

// 可重排序列表
function ReorderableList({ items, setItems }) {
  return (
    <Reorder.Group values={items} onReorder={setItems}>
      {items.map((item) => (
        <Reorder.Item key={item.id} value={item}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileDrag={{ scale: 1.05 }}
            className="reorder-item"
          >
            {item.text}
          </motion.div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
```

#### 适用场景和优势

**✅ 适用场景：**
- 🎨 需要丰富动画效果的应用
- 🎯 既需要拖拽又需要其他动画
- 🚀 现代化的用户界面

**🌟 核心优势：**
- 🎨 一流的动画效果
- 📐 声明式 API
- ⚡ 优秀的性能
- 🎯 简洁的拖拽实现

**⚠️ 注意事项：**
- 📦 包体积较大（如果只需要拖拽功能）
- 🔧 拖拽功能相对简单

## 📊 React DnD 库选择指南

### 技术对比表

| 特性 | React DnD | @dnd-kit | react-beautiful-dnd | react-sortable-hoc | framer-motion |
|------|-----------|----------|---------------------|-------------------|---------------|
| **包大小** | ~50KB | ~30KB | ~32KB | ~15KB | ~60KB |
| **学习曲线** | 🔴 陡峭 | 🟡 中等 | 🟢 平缓 | 🟢 平缓 | 🟡 中等 |
| **移动端支持** | 🟡 中等 | ✅ 优秀 | 🟡 中等 | 🟡 中等 | ✅ 优秀 |
| **可访问性** | 🟡 基础 | ✅ 一流 | 🟡 基础 | ❌ 较差 | 🟡 基础 |
| **自定义能力** | ✅ 极强 | ✅ 很强 | 🟡 中等 | 🟡 中等 | ✅ 很强 |
| **维护状态** | ✅ 活跃 | ✅ 活跃 | ⚠️ 维护模式 | ❌ 停止 | ✅ 活跃 |
| **TypeScript** | ✅ 优秀 | ✅ 优秀 | ✅ 支持 | 🟡 基础 | ✅ 优秀 |

### 选择建议

#### 🎯 选择 @dnd-kit 当你需要：
```javascript
// 现代化的 React 应用
// 优秀的移动端和无障碍支持
// 高性能的拖拽体验
// 复杂的拖拽场景

const features = {
  accessibility: '一流',
  performance: '优秀',
  mobile: '完美支持',
  maintenance: '积极维护',
  recommendation: '🌟 首选推荐'
};
```

#### 🏢 选择 React DnD 当你需要：
```javascript
// 复杂的企业级应用
// 多种类型的拖拽交互
// 精确的拖拽控制
// 完整的测试覆盖

const features = {
  abstraction: '最高',
  flexibility: '极强',
  testing: '内置支持',
  complexity: '适合复杂场景',
  recommendation: '🎯 复杂应用首选'
};
```

#### 📋 选择 react-beautiful-dnd 当你需要：
```javascript
// 简单的列表排序
// 开箱即用的美观效果
// 快速原型开发
// 类似 Trello 的界面

const features = {
  easeOfUse: '极简',
  animations: '出色',
  listSorting: '专门优化',
  maintenance: '⚠️ 维护模式',
  recommendation: '🎨 快速开发可选'
};
```

#### 🎨 选择 framer-motion 当你需要：
```javascript
// 丰富的动画效果
// 拖拽 + 其他动画需求
// 现代化的用户体验
// 品牌级的交互设计

const features = {
  animations: '业界最佳',
  dragAndDrop: '简洁有效',
  ecosystem: '完整动画解决方案',
  bundleSize: '相对较大',
  recommendation: '🚀 动画优先项目'
};
```

## 🛠️ 实战应用案例

### 案例 1：任务看板（@dnd-kit 实现）

```javascript
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function KanbanBoard() {
  const [columns, setColumns] = useState({
    todo: ['task-1', 'task-2'],
    inProgress: ['task-3'],
    done: ['task-4', 'task-5']
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeColumn = findContainer(active.id);
    const overColumn = findContainer(over.id);

    if (activeColumn !== overColumn) {
      // 跨列移动逻辑
      moveToColumn(active.id, activeColumn, overColumn);
    } else {
      // 同列排序逻辑
      reorderInColumn(active.id, activeColumn, over.id);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {Object.entries(columns).map(([columnId, tasks]) => (
          <KanbanColumn key={columnId} id={columnId} tasks={tasks} />
        ))}
      </div>
    </DndContext>
  );
}
```

### 案例 2：文件管理器（React DnD 实现）

```javascript
import { useDrag, useDrop } from 'react-dnd';

const ItemTypes = {
  FILE: 'file',
  FOLDER: 'folder'
};

function FileItem({ file, onMove }) {
  const [{ isDragging }, drag] = useDrag({
    type: file.type === 'folder' ? ItemTypes.FOLDER : ItemTypes.FILE,
    item: { id: file.id, type: file.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.FILE, ItemTypes.FOLDER],
    drop: (item) => onMove(item.id, file.id),
    canDrop: (item) => file.type === 'folder' && item.id !== file.id,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`file-item ${isDragging ? 'dragging' : ''} ${isOver && canDrop ? 'drop-target' : ''}`}
    >
      <Icon type={file.type} />
      <span>{file.name}</span>
    </div>
  );
}
```

---

🎯 **下一步学习建议：**
- 尝试结合 React/Vue 等框架实现拖拽组件
- 探索虚拟滚动 + 拖拽的高性能方案
- 研究 Web Components 中的拖拽实现
- 学习无障碍设计中的拖拽替代方案
- 深入了解 @dnd-kit 的传感器和碰撞检测系统
- 实践复杂的多列表拖拽场景
- 学习拖拽性能优化的最佳实践

**Happy Coding! 🚀**
