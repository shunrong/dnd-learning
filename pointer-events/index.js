// Pointer Events 拖拽实现
let eventLog = document.getElementById('eventLog');
let eventCount = 0;
let activePointers = new Map(); // 跟踪活跃指针

// 统计数据
let stats = {
    pointerCount: 0,
    maxPointers: 0,
    dragSuccessCount: 0
};

// 拖拽状态
let dragState = {
    isDragging: false,
    dragElement: null,
    pointerId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    originalWidth: 0,
    originalHeight: 0
};

// 检测Pointer Events支持
const pointerSupported = 'onpointerdown' in window;
document.getElementById('pointerSupport').textContent = pointerSupported ? '✅ 支持' : '❌ 不支持';

// 记录事件日志
function logEvent(type, message) {
    eventCount++;
    const eventDiv = document.createElement('div');
    eventDiv.className = `event ${type}`;
    eventDiv.innerHTML = `[${eventCount}] ${type.toUpperCase()}: ${message}`;
    eventLog.appendChild(eventDiv);
    eventLog.scrollTop = eventLog.scrollHeight;
}

// 更新统计数据
function updateStats() {
    document.getElementById('pointerCount').textContent = stats.pointerCount;
    document.getElementById('maxPointers').textContent = stats.maxPointers;
    document.getElementById('dragSuccessCount').textContent = stats.dragSuccessCount;
}

// 更新活跃指针显示
function updateActivePointers() {
    const container = document.getElementById('activePointers');
    container.innerHTML = '';
    
    if (activePointers.size === 0) {
        container.textContent = '暂无活跃指针';
        return;
    }
    
    activePointers.forEach((info, pointerId) => {
        const pointerDiv = document.createElement('div');
        pointerDiv.className = 'pointer-item';
        pointerDiv.innerHTML = `ID:${pointerId} | ${info.pointerType} | (${Math.round(info.x)}, ${Math.round(info.y)}) | 压力:${info.pressure.toFixed(2)}`;
        container.appendChild(pointerDiv);
    });
}

// 创建指针可视化
function createPointerVisual(pointerId, pointerType, x, y) {
    const visual = document.createElement('div');
    visual.className = `pointer-visual ${pointerType}`;
    visual.id = `pointer-${pointerId}`;
    visual.style.left = x + 'px';
    visual.style.top = y + 'px';
    document.body.appendChild(visual);
    return visual;
}

// 更新指针可视化位置
function updatePointerVisual(pointerId, x, y) {
    const visual = document.getElementById(`pointer-${pointerId}`);
    if (visual) {
        visual.style.left = x + 'px';
        visual.style.top = y + 'px';
    }
}

// 移除指针可视化
function removePointerVisual(pointerId) {
    const visual = document.getElementById(`pointer-${pointerId}`);
    if (visual) {
        visual.remove();
    }
}

// 清空日志
function clearLog() {
    eventLog.innerHTML = '<div class="event">日志已清空，等待指针操作...</div>';
    eventCount = 0;
}

// 指针按下处理
function handlePointerDown(e) {
    e.preventDefault();
    
    const element = e.target.closest('.draggable-item');
    if (!element) return;

    // 记录指针信息
    activePointers.set(e.pointerId, {
        pointerType: e.pointerType,
        x: e.clientX,
        y: e.clientY,
        pressure: e.pressure
    });

    // 更新统计
    stats.pointerCount++;
    stats.maxPointers = Math.max(stats.maxPointers, activePointers.size);
    updateStats();
    updateActivePointers();

    // 创建指针可视化（注释掉以提高性能）
    // createPointerVisual(e.pointerId, e.pointerType, e.clientX, e.clientY);

    // 设置拖拽状态
    dragState.isDragging = true;
    dragState.dragElement = element;
    dragState.pointerId = e.pointerId;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;

    // 计算偏移并保存原始尺寸
    const rect = element.getBoundingClientRect();
    dragState.offsetX = e.clientX - rect.left;
    dragState.offsetY = e.clientY - rect.top;
    dragState.originalWidth = rect.width;
    dragState.originalHeight = rect.height;

    // 设置指针捕获（重要！）
    element.setPointerCapture(e.pointerId);

    // 创建占位符
    const placeholder = element.cloneNode(true);
    placeholder.classList.add('placeholder');
    element.parentNode.insertBefore(placeholder, element);

    // 设置拖拽样式并保持原始尺寸
    element.classList.add('dragging');
    element.style.width = dragState.originalWidth + 'px';
    element.style.height = dragState.originalHeight + 'px';
    // 在 pointerdown 时保持原位置，不立即移动
    console.log({element, e}, { });
    element.style.left = rect.left + 'px';
    element.style.top = rect.top + 'px';

    // 添加后续事件监听
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
    element.addEventListener('pointercancel', handlePointerCancel);

    const itemName = element.getAttribute('data-item');
    logEvent('pointerdown', `${e.pointerType}指针按下: ${itemName} (ID:${e.pointerId}, 压力:${e.pressure.toFixed(2)})`);
}

// 指针移动处理
function handlePointerMove(e) {
    if (!dragState.isDragging || e.pointerId !== dragState.pointerId) return;

    e.preventDefault();

    // 更新指针信息
    activePointers.set(e.pointerId, {
        pointerType: e.pointerType,
        x: e.clientX,
        y: e.clientY,
        pressure: e.pressure
    });
    updateActivePointers();

    // 更新指针可视化（注释掉以提高性能）
    // updatePointerVisual(e.pointerId, e.clientX, e.clientY);

    // 使用 requestAnimationFrame 确保平滑更新
    requestAnimationFrame(() => {
        if (!dragState.isDragging) return; // 确保仍在拖拽状态
        
        // 更新元素位置
        const newX = e.clientX - dragState.offsetX;
        const newY = e.clientY - dragState.offsetY;
        
        dragState.dragElement.style.left = newX + 'px';
        dragState.dragElement.style.top = newY + 'px';

        // 检测碰撞（需要临时禁用pointer-events）
        dragState.dragElement.style.pointerEvents = 'none';
        const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
        dragState.dragElement.style.pointerEvents = '';

        updateDropZones(elementBelow);
    });

    // 限制日志频率
    if (eventCount % 20 === 0) {
        logEvent('pointermove', `移动到 (${Math.round(e.clientX)}, ${Math.round(e.clientY)}) 压力:${e.pressure.toFixed(2)}`);
    }
}

// 指针抬起处理
function handlePointerUp(e) {
    if (!dragState.isDragging || e.pointerId !== dragState.pointerId) return;

    // 移除指针信息
    activePointers.delete(e.pointerId);
    updateActivePointers();
    // removePointerVisual(e.pointerId);

    // 释放指针捕获
    dragState.dragElement.releasePointerCapture(e.pointerId);

    // 移除事件监听
    dragState.dragElement.removeEventListener('pointermove', handlePointerMove);
    dragState.dragElement.removeEventListener('pointerup', handlePointerUp);
    dragState.dragElement.removeEventListener('pointercancel', handlePointerCancel);

    // 检测放置目标
    dragState.dragElement.style.pointerEvents = 'none';
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
    dragState.dragElement.style.pointerEvents = '';
    
    const dropZone = elementBelow ? elementBelow.closest('.drop-zone') : null;

    // 移除占位符
    const placeholder = document.querySelector('.placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    if (dropZone) {
        // 成功放置
        handleSuccessfulDrop(dropZone);
        stats.dragSuccessCount++;
        updateStats();
    } else {
        // 放置失败，回到原位置
        handleFailedDrop();
    }

    // 清理拖拽状态
    cleanupDragState();
    
    const itemName = dragState.dragElement ? dragState.dragElement.getAttribute('data-item') : 'unknown';
    logEvent('pointerup', `${e.pointerType}指针抬起: ${itemName} ${dropZone ? '(成功放置)' : '(返回原位)'}`);
}

// 指针取消处理
function handlePointerCancel(e) {
    if (!dragState.isDragging || e.pointerId !== dragState.pointerId) return;

    // 移除指针信息
    activePointers.delete(e.pointerId);
    updateActivePointers();
    // removePointerVisual(e.pointerId);

    // 清理状态
    const placeholder = document.querySelector('.placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    handleFailedDrop();
    cleanupDragState();

    logEvent('pointercancel', `指针取消: ${e.pointerType} (ID:${e.pointerId})`);
}

// 成功放置处理
function handleSuccessfulDrop(dropZone) {
    const droppedItem = document.createElement('div');
    droppedItem.className = 'dropped-item';
    droppedItem.textContent = dragState.dragElement.getAttribute('data-item');
    droppedItem.setAttribute('data-original', dragState.dragElement.outerHTML);
    
    // 添加点击返回功能
    droppedItem.addEventListener('click', function() {
        const originalHTML = this.getAttribute('data-original');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = originalHTML;
        const originalElement = tempDiv.firstChild;
        
        // 重新添加事件监听
        addPointerListeners(originalElement);
        
        // 添加回原区域
        document.querySelector('.drag-items').appendChild(originalElement);
        
        // 移除当前项
        this.remove();
        
        // 更新计数
        updateDropZoneCount(dropZone);
        
        logEvent('return', `${this.textContent} 返回到可拖拽区域`);
    });
    
    dropZone.appendChild(droppedItem);
    dropZone.classList.add('has-item');
    
    // 更新计数显示
    updateDropZoneCount(dropZone);
    
    // 移除原元素
    dragState.dragElement.remove();
}

// 失败放置处理
function handleFailedDrop() {
    // 回到原位置的动画
    dragState.dragElement.style.transition = 'all 0.3s ease';
    dragState.dragElement.style.left = '';
    dragState.dragElement.style.top = '';
    
    setTimeout(() => {
        if (dragState.dragElement) {
            dragState.dragElement.style.transition = '';
        }
    }, 300);
}

// 清理拖拽状态
function cleanupDragState() {
    if (dragState.dragElement) {
        dragState.dragElement.classList.remove('dragging');
        dragState.dragElement.style.left = '';
        dragState.dragElement.style.top = '';
        dragState.dragElement.style.width = '';
        dragState.dragElement.style.height = '';
    }
    
    // 清除所有放置区域的悬停状态
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('drag-over');
    });
    
    dragState.isDragging = false;
    dragState.dragElement = null;
    dragState.pointerId = null;
}

// 更新放置区域状态
function updateDropZones(element) {
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('drag-over');
    });

    const dropZone = element ? element.closest('.drop-zone') : null;
    if (dropZone) {
        dropZone.classList.add('drag-over');
    }
}

// 更新放置区域计数
function updateDropZoneCount(dropZone) {
    const status = dropZone.getAttribute('data-status');
    const count = dropZone.querySelectorAll('.dropped-item').length;
    const title = dropZone.querySelector('h4');
    
    const baseTitles = {
        'planning': '📋 规划阶段 (PLANNING)',
        'development': '🔧 开发阶段 (DEVELOPMENT)',
        'testing': '🧪 测试阶段 (TESTING)',
        'production': '🚀 生产阶段 (PRODUCTION)'
    };
    
    title.textContent = count > 0 ? `${baseTitles[status]} (${count})` : baseTitles[status];
}

// 为元素添加指针监听器
function addPointerListeners(element) {
    element.addEventListener('pointerdown', handlePointerDown);
}

// 全局指针事件监听（用于跟踪所有指针）
document.addEventListener('pointerdown', function(e) {
    if (!e.target.closest('.draggable-item')) {
        // 非拖拽元素的指针事件
        activePointers.set(e.pointerId, {
            pointerType: e.pointerType,
            x: e.clientX,
            y: e.clientY,
            pressure: e.pressure
        });
        stats.maxPointers = Math.max(stats.maxPointers, activePointers.size);
        updateStats();
        updateActivePointers();
        // createPointerVisual(e.pointerId, e.pointerType, e.clientX, e.clientY);
    }
});

document.addEventListener('pointermove', function(e) {
    if (activePointers.has(e.pointerId) && !dragState.isDragging) {
        activePointers.set(e.pointerId, {
            pointerType: e.pointerType,
            x: e.clientX,
            y: e.clientY,
            pressure: e.pressure
        });
        updateActivePointers();
        // updatePointerVisual(e.pointerId, e.clientX, e.clientY);
    }
});

document.addEventListener('pointerup', function(e) {
    if (activePointers.has(e.pointerId) && !dragState.isDragging) {
        activePointers.delete(e.pointerId);
        updateActivePointers();
        // removePointerVisual(e.pointerId);
    }
});

// 初始化
function init() {
    if (!pointerSupported) {
        logEvent('error', 'Pointer Events 不被当前浏览器支持');
        return;
    }

    // 为所有可拖拽元素添加事件监听
    document.querySelectorAll('.draggable-item').forEach(addPointerListeners);

    // 初始化提示
    setTimeout(() => {
        logEvent('info', 'Pointer Events 拖拽演示已就绪！');
        logEvent('info', '支持鼠标、触摸、压感笔等所有输入设备');
        logEvent('info', '尝试不同设备进行拖拽，观察指针类型和压力值变化');
        logEvent('info', '点击已放置的项目可以将其返回到拖拽区域');
    }, 500);
}

// 启动应用
init();
