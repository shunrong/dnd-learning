
// Mouse/Touch Events 手动拖拽实现
let eventLog = document.getElementById('eventLog');
let eventCount = 0;

// 统计数据
let stats = {
    dragCount: 0,
    dropCount: 0,
    moveCount: 0
};

// 拖拽状态
let dragState = {
    isDragging: false,
    dragElement: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    lastMoveTime: 0
};

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
    document.getElementById('dragCount').textContent = stats.dragCount;
    document.getElementById('dropCount').textContent = stats.dropCount;
    document.getElementById('moveCount').textContent = stats.moveCount;
}

// 清空日志
function clearLog() {
    eventLog.innerHTML = '<div class="event">日志已清空，等待拖拽操作...</div>';
    eventCount = 0;
}

// 获取统一的坐标（兼容鼠标和触摸）
function getEventCoords(e) {
    if (e.type.startsWith('touch')) {
        const touch = e.touches[0] || e.changedTouches[0];
        return {
            clientX: touch.clientX,
            clientY: touch.clientY
        };
    }
    return {
        clientX: e.clientX,
        clientY: e.clientY
    };
}

// 节流函数
function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
}

// 拖拽开始处理
function handleDragStart(e) {
    e.preventDefault();
    
    const coords = getEventCoords(e);
    const element = e.target.closest('.draggable-item');
    
    if (!element) return;

    dragState.isDragging = true;
    dragState.dragElement = element;
    dragState.startX = coords.clientX;
    dragState.startY = coords.clientY;

    // 计算鼠标相对于元素的偏移
    const rect = element.getBoundingClientRect();
    dragState.offsetX = coords.clientX - rect.left;
    dragState.offsetY = coords.clientY - rect.top;

    // 创建占位符
    const placeholder = element.cloneNode(true);
    placeholder.classList.add('placeholder');
    element.parentNode.insertBefore(placeholder, element);

    // 设置拖拽样式
    element.classList.add('dragging');
    element.style.left = (coords.clientX - dragState.offsetX) + 'px';
    element.style.top = (coords.clientY - dragState.offsetY) + 'px';

    // 添加全局事件监听
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);

    stats.dragCount++;
    updateStats();
    
    const itemName = element.getAttribute('data-item');
    logEvent('start', `开始拖拽: ${itemName} (${e.type})`);
}

// 拖拽移动处理（节流优化）
const handleDragMove = throttle(function(e) {
    if (!dragState.isDragging) return;
    
    e.preventDefault();
    const coords = getEventCoords(e);

    // 更新元素位置
    const newX = coords.clientX - dragState.offsetX;
    const newY = coords.clientY - dragState.offsetY;
    
    dragState.dragElement.style.left = newX + 'px';
    dragState.dragElement.style.top = newY + 'px';

    // 检测碰撞
    const elementBelow = document.elementFromPoint(coords.clientX, coords.clientY);
    updateDropZones(elementBelow);

    stats.moveCount++;
    if (stats.moveCount % 10 === 0) { // 每10次更新一次显示
        updateStats();
    }

    const currentTime = Date.now();
    if (currentTime - dragState.lastMoveTime > 100) { // 限制日志频率
        logEvent('move', `移动到 (${Math.round(coords.clientX)}, ${Math.round(coords.clientY)})`);
        dragState.lastMoveTime = currentTime;
    }
}, 16); // 约60fps

// 拖拽结束处理
function handleDragEnd(e) {
    if (!dragState.isDragging) return;

    const coords = getEventCoords(e);
    
    // 移除全局事件监听
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);

    // 检测放置目标
    const elementBelow = document.elementFromPoint(coords.clientX, coords.clientY);
    const dropZone = elementBelow ? elementBelow.closest('.drop-zone') : null;

    // 移除占位符
    const placeholder = document.querySelector('.placeholder');
    if (placeholder) {
        placeholder.remove();
    }

    if (dropZone) {
        // 成功放置
        handleSuccessfulDrop(dropZone);
        stats.dropCount++;
    } else {
        // 放置失败，回到原位置
        handleFailedDrop();
    }

    // 清理拖拽状态
    cleanupDragState();
    updateStats();
    
    const itemName = dragState.dragElement.getAttribute('data-item');
    logEvent('end', `拖拽结束: ${itemName} ${dropZone ? '(成功放置)' : '(返回原位)'}`);
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
        addDragListeners(originalElement);
        
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
        dragState.dragElement.style.transition = '';
    }, 300);
}

// 清理拖拽状态
function cleanupDragState() {
    if (dragState.dragElement) {
        dragState.dragElement.classList.remove('dragging');
        dragState.dragElement.style.left = '';
        dragState.dragElement.style.top = '';
    }
    
    // 清除所有放置区域的悬停状态
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('drag-over');
    });
    
    dragState.isDragging = false;
    dragState.dragElement = null;
}

// 更新放置区域状态
function updateDropZones(element) {
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('drag-over');
    });

    const dropZone = element ? element.closest('.drop-zone') : null;
    if (dropZone) {
        dropZone.classList.add('drag-over');
        
        const status = dropZone.getAttribute('data-status');
        if (dropZone !== dragState.lastHoverZone) {
            logEvent('enter', `进入放置区域: ${status.toUpperCase()}`);
            dragState.lastHoverZone = dropZone;
        }
    } else if (dragState.lastHoverZone) {
        logEvent('leave', '离开放置区域');
        dragState.lastHoverZone = null;
    }
}

// 更新放置区域计数
function updateDropZoneCount(dropZone) {
    const status = dropZone.getAttribute('data-status');
    const count = dropZone.querySelectorAll('.dropped-item').length;
    const title = dropZone.querySelector('h4');
    
    const baseTitles = {
        'backlog': '📋 待处理 (BACKLOG)',
        'progress': '🔄 进行中 (IN PROGRESS)',
        'review': '👀 待审核 (REVIEW)',
        'completed': '✅ 已完成 (COMPLETED)'
    };
    
    title.textContent = count > 0 ? `${baseTitles[status]} (${count})` : baseTitles[status];
}

// 为元素添加拖拽监听器
function addDragListeners(element) {
    // 鼠标事件
    element.addEventListener('mousedown', handleDragStart);
    
    // 触摸事件
    element.addEventListener('touchstart', handleDragStart, { passive: false });
}

// 初始化
function init() {
    // 检测触摸支持
    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    document.getElementById('touchSupport').textContent = touchSupported ? '✅' : '❌';
    
    // 为所有可拖拽元素添加事件监听
    document.querySelectorAll('.draggable-item').forEach(addDragListeners);
    
    // 防止页面滚动干扰
    document.addEventListener('touchmove', function(e) {
        if (dragState.isDragging) {
            e.preventDefault();
        }
    }, { passive: false });

    // 初始化提示
    setTimeout(() => {
        logEvent('info', 'Mouse/Touch 拖拽演示已就绪！');
        logEvent('info', touchSupported ? '检测到触摸支持，可以使用手指拖拽' : '使用鼠标进行拖拽操作');
        logEvent('info', '点击已放置的项目可以将其返回到拖拽区域');
    }, 500);
}

// 启动应用
init();
