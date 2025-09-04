/**
 * HTML5 Drag & Drop API 增强实现
 * 支持真正的移动、双向拖拽和平滑排序动画
 */

// ==========================================================================
// 全局变量
// ==========================================================================

let eventLog;
let eventCount = 0;
let draggedElement = null; // 跟踪当前被拖拽的元素

// ==========================================================================
// 工具函数
// ==========================================================================

/**
 * 记录事件日志
 * @param {string} type - 事件类型
 * @param {string} message - 日志消息
 */
function logEvent(type, message) {
    eventCount++;
    const eventDiv = document.createElement('div');
    eventDiv.className = `event ${type}`;
    eventDiv.innerHTML = `[${eventCount}] ${type.toUpperCase()}: ${message}`;
    eventLog.appendChild(eventDiv);
    eventLog.scrollTop = eventLog.scrollHeight;
}

/**
 * 清空日志
 */
function clearLog() {
    eventLog.innerHTML = '<div class="event">日志已清空，等待拖拽操作...</div>';
    eventCount = 0;
}

/**
 * 获取原始元素文本（包含emoji等）
 * @param {string} itemData - 元素数据标识
 * @returns {string} 原始完整文本
 */
function getOriginalItemText(itemData) {
    const originalTexts = {
        '任务A': '📋 任务A - 完成项目文档',
        '任务B': '🎨 任务B - 设计用户界面',
        '任务C': '💻 任务C - 编写核心代码',
        '任务D': '🧪 任务D - 测试功能模块'
    };
    return originalTexts[itemData] || itemData;
}

// ==========================================================================
// 拖拽元素管理
// ==========================================================================

/**
 * 创建可拖拽元素的通用函数
 * @param {string} itemData - 元素数据
 * @param {string} itemText - 显示文本
 * @param {string} className - CSS类名
 * @returns {HTMLElement} 创建的元素
 */
function createDraggableElement(itemData, itemText, className = 'draggable-item') {
    const element = document.createElement('div');
    element.className = className;
    element.draggable = true;
    element.setAttribute('data-item', itemData);
    element.textContent = itemText;
    
    // 绑定拖拽事件
    bindDragEvents(element);
    
    return element;
}

/**
 * 绑定拖拽事件到元素
 * @param {HTMLElement} element - 要绑定事件的元素
 */
function bindDragEvents(element) {
    // 开始拖拽
    element.addEventListener('dragstart', function(e) {
        draggedElement = this; // 记录被拖拽的元素
        
        const itemData = this.getAttribute('data-item');
        e.dataTransfer.setData('text/plain', itemData);
        e.dataTransfer.setData('text/html', this.outerHTML);
        e.dataTransfer.setData('application/x-element-id', this.id || Date.now().toString());
        
        // 设置拖拽效果为移动
        e.dataTransfer.effectAllowed = 'move';
        
        // 添加拖拽样式
        this.classList.add('dragging');
        
        logEvent('dragstart', `开始拖拽: ${itemData} (${this.className.includes('dropped-item') ? '从右侧' : '从左侧'})`);
    });

    // 拖拽过程中
    element.addEventListener('drag', function(e) {
        if (!this.hasAttribute('data-dragging')) {
            this.setAttribute('data-dragging', 'true');
            logEvent('drag', '拖拽进行中...');
        }
    });

    // 拖拽结束
    element.addEventListener('dragend', function(e) {
        this.classList.remove('dragging');
        this.removeAttribute('data-dragging');
        
        // 清理全局状态
        draggedElement = null;
        
        logEvent('dragend', `拖拽结束: ${this.getAttribute('data-item')}`);
    });
}

/**
 * 查找并移除原始元素
 * @param {string} itemData - 元素数据标识
 * @returns {boolean} 是否成功移除
 */
function findAndRemoveOriginalElement(itemData) {
    // 查找所有可能的元素位置
    const selectors = [
        `.draggable-item[data-item="${itemData}"]`,
        `.dropped-item[data-item="${itemData}"]`
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element === draggedElement) {
            // 添加移除动画
            element.style.transition = 'all 0.3s ease';
            element.style.opacity = '0';
            element.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                if (element.parentNode) {
                    element.remove();
                    logEvent('move', `元素已从原位置移除: ${itemData}`);
                }
            }, 300);
            
            return true;
        }
    }
    return false;
}

// ==========================================================================
// 区域管理
// ==========================================================================

/**
 * 更新区域计数显示
 * @param {HTMLElement} zone - 放置区域元素
 */
function updateZoneCount(zone) {
    const status = zone.getAttribute('data-status');
    const count = zone.querySelectorAll('.dropped-item').length;
    const title = zone.querySelector('h4');
    
    if (title) {
        const baseTitles = {
            'todo': '📝 待办 (TODO)',
            'doing': '🔄 进行中 (DOING)', 
            'done': '✅ 已完成 (DONE)'
        };
        title.textContent = count > 0 ? `${baseTitles[status]} (${count})` : baseTitles[status];
    }
    
    // 更新样式
    if (count > 0) {
        zone.classList.add('has-item');
    } else {
        zone.classList.remove('has-item');
    }
}

/**
 * 处理拖拽到右侧状态区域
 * @param {HTMLElement} zone - 目标区域
 * @param {string} itemData - 元素数据
 */
function handleDropToStatusZone(zone, itemData) {
    const status = zone.getAttribute('data-status');
    
    // 移除原始元素（真正的移动）
    const removed = findAndRemoveOriginalElement(itemData);
    
    if (removed) {
        // 创建新的放置元素
        const droppedItem = createDraggableElement(itemData, itemData, 'dropped-item');
        
        // 添加到放置区域
        zone.appendChild(droppedItem);
        
        // 更新区域显示
        updateZoneCount(zone);
        
        logEvent('drop', `✅ 真正移动: ${itemData} → ${status.toUpperCase()}`);
    }
}

/**
 * 处理拖拽回到左侧原始区域
 * @param {HTMLElement} container - 目标容器
 * @param {string} itemData - 元素数据
 */
function handleDropToOriginalContainer(container, itemData) {
    // 移除原始元素
    const removed = findAndRemoveOriginalElement(itemData);
    
    if (removed) {
        // 重新创建原始样式的元素
        const originalText = getOriginalItemText(itemData);
        const restoredItem = createDraggableElement(itemData, originalText, 'draggable-item');
        
        // 添加回原始容器
        container.appendChild(restoredItem);
        
        // 更新所有区域计数
        document.querySelectorAll('.drop-zone').forEach(updateZoneCount);
        
        logEvent('drop', `↩️ 元素已返回原始区域: ${itemData}`);
    }
}

// ==========================================================================
// 排序功能
// ==========================================================================

/**
 * 设置容器的排序功能
 * @param {HTMLElement} container - 支持排序的容器
 */
function setupSortableContainer(container) {
    let currentInsertIndex = -1;
    let originalPosition = null;

    /**
     * 获取最近的插入位置
     * @param {number} y - 鼠标Y坐标
     * @returns {number} 插入位置索引
     */
    function getInsertPosition(y) {
        const items = [...container.querySelectorAll('.draggable-item:not(.dragging)')];
        let closestIndex = 0;
        let closestDistance = Infinity;

        items.forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            const itemCenterY = rect.top + rect.height / 2;
            const distance = Math.abs(y - itemCenterY);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = y < itemCenterY ? index : index + 1;
            }
        });

        return Math.min(closestIndex, items.length);
    }

    /**
     * 保存元素的原始位置
     * @param {HTMLElement} element - 要保存位置的元素
     */
    function saveOriginalPosition(element) {
        const items = [...container.querySelectorAll('.draggable-item')];
        originalPosition = items.indexOf(element);
    }

    /**
     * 实时移动被拖拽元素到目标位置（带平滑动画）
     * @param {HTMLElement} draggedEl - 被拖拽的元素
     * @param {number} insertIndex - 目标插入位置
     */
    function moveElementToPosition(draggedEl, insertIndex) {
        if (insertIndex === currentInsertIndex) return; // 位置未改变
        
        currentInsertIndex = insertIndex;
        
        // 获取所有元素的当前位置
        const allItems = [...container.querySelectorAll('.draggable-item')];
        const positions = new Map();
        
        // 记录当前位置
        allItems.forEach(item => {
            const rect = item.getBoundingClientRect();
            positions.set(item, {
                top: rect.top,
                left: rect.left
            });
        });
        
        // 移除被拖拽元素（临时）
        draggedEl.remove();
        
        // 重新获取剩余元素
        const remainingItems = [...container.querySelectorAll('.draggable-item')];
        
        // 将被拖拽元素插入到新位置
        if (insertIndex >= remainingItems.length) {
            container.appendChild(draggedEl);
        } else {
            container.insertBefore(draggedEl, remainingItems[insertIndex]);
        }
        
        // 计算新位置并应用动画
        const newAllItems = [...container.querySelectorAll('.draggable-item')];
        newAllItems.forEach(item => {
            if (item === draggedEl) return; // 跳过被拖拽元素
            
            const oldPos = positions.get(item);
            if (!oldPos) return;
            
            const newRect = item.getBoundingClientRect();
            const deltaX = oldPos.left - newRect.left;
            const deltaY = oldPos.top - newRect.top;
            
            if (deltaX !== 0 || deltaY !== 0) {
                // 先设置到旧位置（无过渡）
                item.style.transition = 'none';
                item.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                
                // 强制重排
                item.offsetHeight;
                
                // 然后动画到新位置
                item.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                item.style.transform = 'translate(0, 0)';
            }
        });
        
        // 被拖拽元素的动画处理
        const draggedOldPos = positions.get(draggedEl);
        if (draggedOldPos) {
            const draggedNewRect = draggedEl.getBoundingClientRect();
            const deltaX = draggedOldPos.left - draggedNewRect.left;
            const deltaY = draggedOldPos.top - draggedNewRect.top;
            
            if (deltaX !== 0 || deltaY !== 0) {
                // 被拖拽元素也需要平滑过渡（但保持拖拽状态）
                draggedEl.style.transition = 'none';
                draggedEl.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.02)`;
                
                // 强制重排
                draggedEl.offsetHeight;
                
                // 动画到新位置
                draggedEl.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                draggedEl.style.transform = 'scale(1.02)'; // 保持拖拽状态的缩放
            }
        }
        
        // 清理动画状态
        setTimeout(() => {
            newAllItems.forEach(item => {
                if (item !== draggedEl) {
                    item.style.transition = '';
                    item.style.transform = '';
                }
            });
            
            // 被拖拽元素保持拖拽样式，但清理过渡
            if (draggedEl.style.transition !== '') {
                draggedEl.style.transition = '';
            }
        }, 300);
    }

    /**
     * 恢复到原始位置（带平滑动画）
     * @param {HTMLElement} draggedEl - 被拖拽的元素
     */
    function restoreOriginalPosition(draggedEl) {
        if (originalPosition === null) return;
        
        // 获取所有元素的当前位置
        const allItems = [...container.querySelectorAll('.draggable-item')];
        const positions = new Map();
        
        // 记录当前位置
        allItems.forEach(item => {
            const rect = item.getBoundingClientRect();
            positions.set(item, {
                top: rect.top,
                left: rect.left
            });
        });
        
        // 移除被拖拽元素
        draggedEl.remove();
        
        // 重新获取剩余元素
        const remainingItems = [...container.querySelectorAll('.draggable-item')];
        
        // 插入到原始位置
        if (originalPosition >= remainingItems.length) {
            container.appendChild(draggedEl);
        } else {
            container.insertBefore(draggedEl, remainingItems[originalPosition]);
        }
        
        // 计算新位置并应用动画
        const newAllItems = [...container.querySelectorAll('.draggable-item')];
        newAllItems.forEach(item => {
            if (item === draggedEl) return; // 跳过被拖拽元素
            
            const oldPos = positions.get(item);
            if (!oldPos) return;
            
            const newRect = item.getBoundingClientRect();
            const deltaX = oldPos.left - newRect.left;
            const deltaY = oldPos.top - newRect.top;
            
            if (deltaX !== 0 || deltaY !== 0) {
                // 先设置到旧位置（无过渡）
                item.style.transition = 'none';
                item.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                
                // 强制重排
                item.offsetHeight;
                
                // 然后动画到新位置
                item.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
                item.style.transform = 'translate(0, 0)';
            }
        });
        
        // 被拖拽元素的恢复动画
        const draggedOldPos = positions.get(draggedEl);
        if (draggedOldPos) {
            const draggedNewRect = draggedEl.getBoundingClientRect();
            const deltaX = draggedOldPos.left - draggedNewRect.left;
            const deltaY = draggedOldPos.top - draggedNewRect.top;
            
            if (deltaX !== 0 || deltaY !== 0) {
                draggedEl.style.transition = 'none';
                draggedEl.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.02)`;
                
                // 强制重排
                draggedEl.offsetHeight;
                
                // 动画到原始位置
                draggedEl.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
                draggedEl.style.transform = 'scale(1.02)';
            }
        }
        
        // 清理动画状态
        setTimeout(() => {
            newAllItems.forEach(item => {
                item.style.transition = '';
                item.style.transform = '';
            });
        }, 250);
        
        currentInsertIndex = -1;
        originalPosition = null;
    }

    /**
     * 检查是否是同容器内的拖拽
     * @param {HTMLElement} draggedEl - 被拖拽的元素
     * @returns {boolean} 是否是同容器拖拽
     */
    function isSameDragContainer(draggedEl) {
        return draggedEl && 
               draggedEl.classList.contains('draggable-item') && 
               draggedEl.parentNode === container;
    }

    // 排序专用事件处理
    container.addEventListener('dragenter', function(e) {
        if (isSameDragContainer(draggedElement)) {
            e.preventDefault();
            this.classList.add('sorting');
            
            // 保存原始位置
            saveOriginalPosition(draggedElement);
            
            logEvent('sort', '进入排序模式');
        }
    });

    container.addEventListener('dragover', function(e) {
        if (isSameDragContainer(draggedElement)) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const insertIndex = getInsertPosition(e.clientY);
            
            // 实时移动元素位置
            moveElementToPosition(draggedElement, insertIndex);
            
            // 避免频繁日志
            if (!this.hasAttribute('data-sorting')) {
                this.setAttribute('data-sorting', 'true');
                logEvent('sort', `排序中，实时调整位置`);
            }
        }
    });

    container.addEventListener('dragleave', function(e) {
        if (isSameDragContainer(draggedElement) && !this.contains(e.relatedTarget)) {
            this.classList.remove('sorting');
            this.removeAttribute('data-sorting');
            
            // 恢复到原始位置
            restoreOriginalPosition(draggedElement);
            
            logEvent('sort', '退出排序模式，恢复原始位置');
        }
    });

    container.addEventListener('drop', function(e) {
        if (isSameDragContainer(draggedElement)) {
            e.preventDefault();
            e.stopPropagation(); // 阻止冒泡到全局drop处理
            
            this.classList.remove('sorting');
            this.removeAttribute('data-sorting');
            
            const finalIndex = currentInsertIndex;
            
            if (finalIndex !== -1 && finalIndex !== originalPosition) {
                // 确认排序完成
                handleSortingComplete(draggedElement);
                logEvent('sort', `✅ 排序完成: 从位置 ${originalPosition + 1} → ${finalIndex + 1}`);
            } else {
                logEvent('sort', '位置未改变，取消排序');
            }
            
            // 重置状态
            currentInsertIndex = -1;
            originalPosition = null;
        }
    });
}

/**
 * 排序完成处理
 * @param {HTMLElement} draggedEl - 被拖拽的元素
 */
function handleSortingComplete(draggedEl) {
    // 移除排序模式样式
    draggedEl.classList.remove('sorting-mode');
    
    // 添加完成反馈动画
    draggedEl.classList.add('sort-completed');
    
    // 恢复原始样式
    setTimeout(() => {
        draggedEl.classList.remove('sort-completed');
    }, 800);
}

// ==========================================================================
// 放置区域管理
// ==========================================================================

/**
 * 设置放置区域的事件
 * @param {HTMLElement} zone - 放置区域元素
 * @param {boolean} isOriginalContainer - 是否是原始容器
 */
function setupDropZoneEvents(zone, isOriginalContainer = false) {
    // 拖拽元素进入放置区域
    zone.addEventListener('dragenter', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
        
        const zoneType = isOriginalContainer ? '原始区域' : this.getAttribute('data-status')?.toUpperCase();
        logEvent('dragenter', `进入放置区域: ${zoneType}`);
    });

    // 拖拽元素在放置区域上方
    zone.addEventListener('dragover', function(e) {
        e.preventDefault(); // 关键！允许放置
        
        // 设置拖放效果
        e.dataTransfer.dropEffect = 'move';
        
        // 避免频繁日志
        if (!this.hasAttribute('data-over')) {
            this.setAttribute('data-over', 'true');
            logEvent('dragover', '悬停在放置区域上方');
        }
        
        return false;
    });

    // 拖拽元素离开放置区域
    zone.addEventListener('dragleave', function(e) {
        if (!this.contains(e.relatedTarget)) {
            this.classList.remove('drag-over');
            this.removeAttribute('data-over');
            logEvent('dragleave', '离开放置区域');
        }
    });

    // 放置操作
    zone.addEventListener('drop', function(e) {
        e.preventDefault();
        
        // 移除悬停样式
        this.classList.remove('drag-over');
        this.removeAttribute('data-over');
        
        // 获取拖拽数据
        const itemData = e.dataTransfer.getData('text/plain');
        
        if (itemData && draggedElement) {
            // 检查是否拖拽到原位置
            if (draggedElement.parentNode === this) {
                logEvent('drop', `元素未移动，仍在原位置: ${itemData}`);
                return;
            }

            if (isOriginalContainer) {
                // 拖回左侧原始区域
                handleDropToOriginalContainer(this, itemData);
            } else {
                // 拖到右侧状态区域
                handleDropToStatusZone(this, itemData);
            }
        }
    });
}

// ==========================================================================
// 初始化函数
// ==========================================================================

/**
 * 初始化所有拖拽元素的事件绑定
 */
function initializeDragElements() {
    document.querySelectorAll('.draggable-item').forEach(bindDragEvents);
}

/**
 * 设置放置目标的事件处理
 */
function setupDropZones() {
    // 右侧放置区域
    document.querySelectorAll('.drop-zone').forEach(zone => {
        setupDropZoneEvents(zone);
    });

    // 左侧原始区域：同时支持接收放置和排序
    const dragItemsContainer = document.querySelector('.drag-items');
    setupDropZoneEvents(dragItemsContainer, true);
    setupSortableContainer(dragItemsContainer);
}

/**
 * 全局事件处理
 */
function setupGlobalEvents() {
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
    });

    document.addEventListener('drop', function(e) {
        e.preventDefault();
    });
}

/**
 * 双击清空功能（增强版）
 */
function setupClearFunctions() {
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.addEventListener('dblclick', function() {
            const droppedItems = this.querySelectorAll('.dropped-item');
            const itemCount = droppedItems.length;
            
            droppedItems.forEach(item => {
                const itemData = item.getAttribute('data-item');
                
                // 添加清空动画
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '0';
                item.style.transform = 'translateY(-20px)';
                
                setTimeout(() => {
                    item.remove();
                }, 300);
                
                // 将元素返回到左侧原始区域
                setTimeout(() => {
                    const originalText = getOriginalItemText(itemData);
                    const restoredItem = createDraggableElement(itemData, originalText, 'draggable-item');
                    document.querySelector('.drag-items').appendChild(restoredItem);
                }, 350);
            });
            
            // 更新区域显示
            setTimeout(() => {
                updateZoneCount(this);
            }, 400);
            
            const status = this.getAttribute('data-status');
            logEvent('clear', `清空了 ${status.toUpperCase()} 区域，${itemCount} 个元素已返回原始区域`);
        });
    });
}

/**
 * 初始化应用
 */
function initializeApp() {
    // 获取日志元素
    eventLog = document.getElementById('eventLog');
    
    // 初始化各个功能模块
    initializeDragElements();
    setupDropZones();
    setupGlobalEvents();
    setupClearFunctions();
    
    // 初始化提示
    setTimeout(() => {
        logEvent('info', '🚀 HTML5 完整版拖拽演示已就绪！');
        logEvent('info', '✨ 新功能：左侧列表支持拖拽排序');
        logEvent('info', '🔄 试试在左侧拖拽任务重新排序');
        logEvent('info', '↔️ 也可以从左侧拖到右侧，或从右侧拖回左侧');
        logEvent('info', '💡 双击右侧区域可以清空并返回所有元素');
    }, 500);
}

// ==========================================================================
// 启动应用
// ==========================================================================

// DOM加载完成后启动应用
document.addEventListener('DOMContentLoaded', initializeApp);

// 如果DOM已经加载完成，直接初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// 将清空日志函数暴露到全局，供HTML中的onclick使用
window.clearLog = clearLog;
