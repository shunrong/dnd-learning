/**
 * PointerDragDrop - 基于 Pointer Events 的拖拽库
 * 提供类似 HTML5 Drag and Drop 的 API，但内部使用 Pointer Events 实现
 */
class PointerDragDrop {
    constructor(options = {}) {
        // 配置选项
        this.options = {
            dragClass: 'dragging',
            placeholderClass: 'placeholder',
            dropZoneClass: 'drop-zone',
            dragOverClass: 'drag-over',
            ...options
        };

        // 拖拽状态
        this.dragState = {
            isDragging: false,
            dragElement: null,
            pointerId: null,
            startPosition: { x: 0, y: 0 },
            offset: { x: 0, y: 0 },
            originalSize: { width: 0, height: 0 },
            placeholder: null,
            currentDropZone: null,
            // 排序相关状态
            isSorting: false,
            sortContainer: null,
            originalPosition: -1,
            currentInsertIndex: -1
        };

        // 事件监听器存储
        this.listeners = new Map();
        
        // 初始化
        this.init();
    }

    /**
     * 初始化拖拽功能
     */
    init() {
        // 检查 Pointer Events 支持
        if (!('onpointerdown' in window)) {
            console.warn('Pointer Events not supported');
            return;
        }

        // 全局指针事件监听（用于清理）
        document.addEventListener('pointerup', this.handleGlobalPointerUp.bind(this));
        document.addEventListener('pointercancel', this.handleGlobalPointerCancel.bind(this));
    }

    /**
     * 使元素可拖拽 - 类似 HTML5 的 draggable="true"
     * @param {HTMLElement|string} element - 元素或选择器
     * @param {Object} options - 拖拽选项
     */
    makeDraggable(element, options = {}) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;

        // 设置元素数据
        el.setAttribute('data-draggable', 'true');
        
        // 合并选项
        const config = { ...this.options, ...options };
        el._dragConfig = config;

        // 添加指针事件监听
        el.addEventListener('pointerdown', this.handlePointerDown.bind(this));

        // 设置样式
        el.style.touchAction = 'none';
        if (!el.style.cursor) {
            el.style.cursor = 'grab';
        }
    }

    /**
     * 使元素成为放置区域 - 类似 HTML5 的 drop 事件
     * @param {HTMLElement|string} element - 元素或选择器
     * @param {Object} options - 放置选项
     */
    makeDropZone(element, options = {}) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;

        el.setAttribute('data-drop-zone', 'true');
        el._dropConfig = { ...this.options, ...options };
        
        // 添加样式标识
        if (!el.classList.contains(this.options.dropZoneClass)) {
            el.classList.add(this.options.dropZoneClass);
        }
    }

    /**
     * 使容器支持排序 - 类似 HTML5 DnD 的排序功能
     * @param {HTMLElement|string} element - 容器元素或选择器
     * @param {Object} options - 排序选项
     */
    makeSortable(element, options = {}) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;

        el.setAttribute('data-sortable', 'true');
        el._sortConfig = { ...this.options, ...options };
        
        // 同时设置为放置区域，以便接收拖拽事件
        this.makeDropZone(el, options);
    }

    /**
     * 添加事件监听器 - 类似 HTML5 DnD 事件
     * @param {string} eventType - 事件类型 (dragstart, drag, dragend, dragover, drop)
     * @param {Function} callback - 回调函数
     */
    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    }

    /**
     * 移除事件监听器
     * @param {string} eventType - 事件类型
     * @param {Function} callback - 回调函数
     */
    off(eventType, callback) {
        if (!this.listeners.has(eventType)) return;
        
        const callbacks = this.listeners.get(eventType);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * 触发事件
     * @param {string} eventType - 事件类型
     * @param {Object} eventData - 事件数据
     */
    emit(eventType, eventData) {
        if (!this.listeners.has(eventType)) return;

        const callbacks = this.listeners.get(eventType);
        callbacks.forEach(callback => {
            try {
                callback(eventData);
            } catch (error) {
                console.error(`Error in ${eventType} event handler:`, error);
            }
        });
    }

    /**
     * 指针按下处理 - 对应 HTML5 的 dragstart
     */
    handlePointerDown(e) {
        e.preventDefault();
        
        const element = e.target.closest('[data-draggable="true"]');
        if (!element) return;

        // 设置拖拽状态
        this.dragState.isDragging = true;
        this.dragState.dragElement = element;
        this.dragState.pointerId = e.pointerId;
        this.dragState.startPosition = { x: e.clientX, y: e.clientY };

        // 检查是否在可排序容器内
        const sortableContainer = element.closest('[data-sortable="true"]');
        if (sortableContainer) {
            this.dragState.sortContainer = sortableContainer;
            this.dragState.originalPosition = this.getElementIndex(element, sortableContainer);
            this.dragState.currentInsertIndex = -1;
        } else {
            this.dragState.sortContainer = null;
            this.dragState.originalPosition = -1;
        }

        // 计算偏移和保存尺寸
        const rect = element.getBoundingClientRect();
        this.dragState.offset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        this.dragState.originalSize = {
            width: rect.width,
            height: rect.height
        };

        // 设置指针捕获
        element.setPointerCapture(e.pointerId);

        // 创建占位符
        this.createPlaceholder(element);

        // 应用拖拽样式
        this.applyDragStyles(element, rect);

        // 添加移动和结束事件监听
        element.addEventListener('pointermove', this.handlePointerMove.bind(this));
        element.addEventListener('pointerup', this.handlePointerUp.bind(this));
        element.addEventListener('pointercancel', this.handlePointerCancel.bind(this));

        // 改变光标
        element.style.cursor = 'grabbing';

        // 触发 dragstart 事件
        this.emit('dragstart', {
            type: 'dragstart',
            originalEvent: e,
            dragElement: element,
            startPosition: { ...this.dragState.startPosition },
            isSortable: !!sortableContainer
        });
    }

    /**
     * 指针移动处理 - 对应 HTML5 的 drag
     */
    handlePointerMove(e) {
        if (!this.dragState.isDragging || e.pointerId !== this.dragState.pointerId) return;

        e.preventDefault();

        // 记录当前Y坐标用于排序
        this.lastPointerY = e.clientY;

        // 使用 requestAnimationFrame 优化性能
        requestAnimationFrame(() => {
            if (!this.dragState.isDragging) return;

            // 更新元素位置
            this.updateDragPosition(e);

            // 检测放置区域
            this.detectDropZone(e);

            // 触发 drag 事件
            this.emit('drag', {
                type: 'drag',
                originalEvent: e,
                dragElement: this.dragState.dragElement,
                currentPosition: { x: e.clientX, y: e.clientY },
                offset: { ...this.dragState.offset }
            });
        });
    }

    /**
     * 指针抬起处理 - 对应 HTML5 的 dragend 和 drop
     */
    handlePointerUp(e) {
        if (!this.dragState.isDragging || e.pointerId !== this.dragState.pointerId) return;

        const dragElement = this.dragState.dragElement;
        const dropZone = this.detectDropZone(e);

        // 释放指针捕获
        dragElement.releasePointerCapture(e.pointerId);

        // 移除事件监听器
        this.removeEventListeners(dragElement);

        // 处理放置结果
        const dropSuccess = this.handleDrop(dropZone, e);

        // 清理拖拽状态
        this.cleanup();

        // 触发相应事件
        if (dropSuccess && dropZone) {
            this.emit('drop', {
                type: 'drop',
                originalEvent: e,
                dragElement: dragElement,
                dropZone: dropZone,
                dropPosition: { x: e.clientX, y: e.clientY }
            });
        }

        this.emit('dragend', {
            type: 'dragend',
            originalEvent: e,
            dragElement: dragElement,
            dropZone: dropZone,
            success: dropSuccess
        });
    }

    /**
     * 指针取消处理
     */
    handlePointerCancel(e) {
        if (!this.dragState.isDragging || e.pointerId !== this.dragState.pointerId) return;

        const dragElement = this.dragState.dragElement;

        // 移除事件监听器
        this.removeEventListeners(dragElement);

        // 恢复元素到原位置
        this.resetDragElement();

        // 清理状态
        this.cleanup();

        // 触发 dragend 事件
        this.emit('dragend', {
            type: 'dragend',
            originalEvent: e,
            dragElement: dragElement,
            dropZone: null,
            success: false,
            cancelled: true
        });
    }

    /**
     * 全局指针事件处理（清理用）
     */
    handleGlobalPointerUp(e) {
        if (this.dragState.isDragging && e.pointerId === this.dragState.pointerId) {
            this.handlePointerUp(e);
        }
    }

    handleGlobalPointerCancel(e) {
        if (this.dragState.isDragging && e.pointerId === this.dragState.pointerId) {
            this.handlePointerCancel(e);
        }
    }

    /**
     * 创建占位符
     */
    createPlaceholder(element) {
        const placeholder = element.cloneNode(true);
        placeholder.classList.add(this.options.placeholderClass);
        placeholder.style.opacity = '0.5';
        placeholder.style.pointerEvents = 'none';
        element.parentNode.insertBefore(placeholder, element);
        this.dragState.placeholder = placeholder;
    }

    /**
     * 应用拖拽样式
     */
    applyDragStyles(element, rect) {
        element.classList.add(this.options.dragClass);
        
        // 保持原始尺寸和位置
        element.style.width = this.dragState.originalSize.width + 'px';
        element.style.height = this.dragState.originalSize.height + 'px';
        element.style.left = rect.left + 'px';
        element.style.top = rect.top + 'px';
    }

    /**
     * 更新拖拽位置
     */
    updateDragPosition(e) {
        const newX = e.clientX - this.dragState.offset.x;
        const newY = e.clientY - this.dragState.offset.y;
        
        this.dragState.dragElement.style.left = newX + 'px';
        this.dragState.dragElement.style.top = newY + 'px';
    }

    /**
     * 检测放置区域
     */
    detectDropZone(e) {
        // 临时隐藏拖拽元素以检测下方元素
        this.dragState.dragElement.style.pointerEvents = 'none';
        const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
        this.dragState.dragElement.style.pointerEvents = '';

        const dropZone = elementBelow ? elementBelow.closest('[data-drop-zone="true"]') : null;

        // 更新放置区域样式
        this.updateDropZoneStyles(dropZone);

        return dropZone;
    }

    /**
     * 更新放置区域样式
     */
    updateDropZoneStyles(newDropZone) {
        // 检查是否在排序容器中
        const isSortableContainer = newDropZone && newDropZone.hasAttribute('data-sortable');
        const wasSortableContainer = this.dragState.currentDropZone && this.dragState.currentDropZone.hasAttribute('data-sortable');

        // 处理离开排序容器
        if (wasSortableContainer && this.dragState.currentDropZone !== newDropZone) {
            if (this.dragState.isSorting) {
                this.dragState.isSorting = false;
                this.dragState.currentDropZone.classList.remove('sorting');
                this.restoreOriginalPosition();
                
                this.emit('sortleave', {
                    type: 'sortleave',
                    dragElement: this.dragState.dragElement,
                    sortContainer: this.dragState.currentDropZone
                });
            }
        }

        // 移除之前的高亮
        if (this.dragState.currentDropZone && this.dragState.currentDropZone !== newDropZone) {
            this.dragState.currentDropZone.classList.remove(this.options.dragOverClass);
            
            // 触发 dragleave 事件
            this.emit('dragleave', {
                type: 'dragleave',
                dragElement: this.dragState.dragElement,
                dropZone: this.dragState.currentDropZone
            });
        }

        // 处理进入排序容器
        if (isSortableContainer && newDropZone !== this.dragState.currentDropZone) {
            if (!this.dragState.isSorting) {
                this.dragState.isSorting = true;
                newDropZone.classList.add('sorting');
                
                this.emit('sortenter', {
                    type: 'sortenter',
                    dragElement: this.dragState.dragElement,
                    sortContainer: newDropZone
                });
            }
        }

        // 添加新的高亮
        if (newDropZone && newDropZone !== this.dragState.currentDropZone) {
            if (!isSortableContainer) {
                newDropZone.classList.add(this.options.dragOverClass);
            }
            
            // 触发 dragenter 事件
            this.emit('dragenter', {
                type: 'dragenter',
                dragElement: this.dragState.dragElement,
                dropZone: newDropZone,
                isSortable: isSortableContainer
            });
        }

        // 处理排序逻辑
        if (isSortableContainer && this.dragState.isSorting) {
            // 使用当前事件的Y坐标进行排序
            const insertIndex = this.getInsertPosition(newDropZone, this.lastPointerY || 0);
            this.moveElementToPosition(newDropZone, this.dragState.dragElement, insertIndex);
        }

        // 触发 dragover 事件
        if (newDropZone) {
            this.emit('dragover', {
                type: 'dragover',
                dragElement: this.dragState.dragElement,
                dropZone: newDropZone,
                isSortable: isSortableContainer
            });
        }

        this.dragState.currentDropZone = newDropZone;
    }

    /**
     * 处理放置
     */
    handleDrop(dropZone, e) {
        if (!dropZone) {
            // 没有有效放置区域，恢复原位置
            this.resetDragElement();
            return false;
        }

        // 检查是否是排序操作
        const isSortableContainer = dropZone.hasAttribute('data-sortable');
        let sortResult = null;

        if (isSortableContainer && this.dragState.isSorting) {
            // 排序完成
            const finalIndex = this.getElementIndex(this.dragState.dragElement, dropZone);
            const originalIndex = this.dragState.originalPosition;
            
            if (finalIndex !== originalIndex) {
                // 位置改变了，排序成功
                sortResult = {
                    success: true,
                    originalIndex: originalIndex,
                    newIndex: finalIndex
                };
                
                // 触发排序完成事件
                this.emit('sortcomplete', {
                    type: 'sortcomplete',
                    dragElement: this.dragState.dragElement,
                    sortContainer: dropZone,
                    originalIndex: originalIndex,
                    newIndex: finalIndex
                });
            } else {
                // 位置没变
                sortResult = {
                    success: false,
                    originalIndex: originalIndex,
                    newIndex: finalIndex
                };
            }
        }

        // 移除拖拽样式
        this.removeDragStyles(this.dragState.dragElement);
        
        // 清理排序状态
        if (this.dragState.isSorting) {
            this.dragState.isSorting = false;
            if (dropZone) {
                dropZone.classList.remove('sorting');
            }
        }
        
        return { success: true, sortResult };
    }

    /**
     * 重置拖拽元素到原位置
     */
    resetDragElement() {
        const element = this.dragState.dragElement;
        
        // 添加过渡动画
        element.style.transition = 'all 0.3s ease';
        
        // 移除拖拽样式
        this.removeDragStyles(element);
        
        // 移除过渡
        setTimeout(() => {
            if (element.style) {
                element.style.transition = '';
            }
        }, 300);
    }

    /**
     * 移除拖拽样式
     */
    removeDragStyles(element) {
        element.classList.remove(this.options.dragClass);
        element.style.left = '';
        element.style.top = '';
        element.style.width = '';
        element.style.height = '';
        element.style.cursor = 'grab';
    }

    /**
     * 移除事件监听器
     */
    removeEventListeners(element) {
        element.removeEventListener('pointermove', this.handlePointerMove);
        element.removeEventListener('pointerup', this.handlePointerUp);
        element.removeEventListener('pointercancel', this.handlePointerCancel);
    }

    /**
     * 清理拖拽状态
     */
    cleanup() {
        // 移除占位符
        if (this.dragState.placeholder && this.dragState.placeholder.parentNode) {
            this.dragState.placeholder.remove();
        }

        // 清除放置区域高亮
        if (this.dragState.currentDropZone) {
            this.dragState.currentDropZone.classList.remove(this.options.dragOverClass);
        }

        // 重置状态
        this.dragState = {
            isDragging: false,
            dragElement: null,
            pointerId: null,
            startPosition: { x: 0, y: 0 },
            offset: { x: 0, y: 0 },
            originalSize: { width: 0, height: 0 },
            placeholder: null,
            currentDropZone: null,
            // 排序相关状态
            isSorting: false,
            sortContainer: null,
            originalPosition: -1,
            currentInsertIndex: -1
        };
    }

    /**
     * 获取元素在容器中的索引
     * @param {HTMLElement} element - 元素
     * @param {HTMLElement} container - 容器
     * @returns {number} 索引
     */
    getElementIndex(element, container) {
        const items = [...container.querySelectorAll('.draggable-item')];
        return items.indexOf(element);
    }

    /**
     * 获取插入位置
     * @param {HTMLElement} container - 容器
     * @param {number} y - Y坐标
     * @returns {number} 插入位置索引
     */
    getInsertPosition(container, y) {
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
     * 实时移动元素到目标位置（带动画）
     * @param {HTMLElement} container - 容器
     * @param {HTMLElement} draggedEl - 被拖拽的元素
     * @param {number} insertIndex - 插入位置
     */
    moveElementToPosition(container, draggedEl, insertIndex) {
        if (insertIndex === this.dragState.currentInsertIndex) return;
        
        this.dragState.currentInsertIndex = insertIndex;
        
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
            if (item === draggedEl) return;
            
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
                
                // 清理动画状态
                setTimeout(() => {
                    if (item.style) {
                        item.style.transition = '';
                        item.style.transform = '';
                    }
                }, 300);
            }
        });
    }

    /**
     * 恢复到原始位置
     */
    restoreOriginalPosition() {
        if (!this.dragState.sortContainer || this.dragState.originalPosition < 0) return;
        
        const container = this.dragState.sortContainer;
        const draggedEl = this.dragState.dragElement;
        
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
        if (this.dragState.originalPosition >= remainingItems.length) {
            container.appendChild(draggedEl);
        } else {
            container.insertBefore(draggedEl, remainingItems[this.dragState.originalPosition]);
        }
        
        // 应用恢复动画
        const newAllItems = [...container.querySelectorAll('.draggable-item')];
        newAllItems.forEach(item => {
            if (item === draggedEl) return;
            
            const oldPos = positions.get(item);
            if (!oldPos) return;
            
            const newRect = item.getBoundingClientRect();
            const deltaX = oldPos.left - newRect.left;
            const deltaY = oldPos.top - newRect.top;
            
            if (deltaX !== 0 || deltaY !== 0) {
                item.style.transition = 'none';
                item.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                item.offsetHeight;
                item.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                item.style.transform = 'translate(0, 0)';
                
                setTimeout(() => {
                    if (item.style) {
                        item.style.transition = '';
                        item.style.transform = '';
                    }
                }, 300);
            }
        });
        
        // 重置插入索引
        this.dragState.currentInsertIndex = -1;
    }

    /**
     * 销毁拖拽实例
     */
    destroy() {
        // 移除全局事件监听
        document.removeEventListener('pointerup', this.handleGlobalPointerUp);
        document.removeEventListener('pointercancel', this.handleGlobalPointerCancel);

        // 清理所有拖拽元素
        document.querySelectorAll('[data-draggable="true"]').forEach(el => {
            el.removeEventListener('pointerdown', this.handlePointerDown);
            el.removeAttribute('data-draggable');
            delete el._dragConfig;
        });

        // 清理所有放置区域
        document.querySelectorAll('[data-drop-zone="true"]').forEach(el => {
            el.removeAttribute('data-drop-zone');
            delete el._dropConfig;
        });

        // 清除事件监听器
        this.listeners.clear();

        // 清理状态
        this.cleanup();
    }
}

// 导出类
window.PointerDragDrop = PointerDragDrop;
