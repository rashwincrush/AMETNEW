import React, { useEffect, useRef, useState } from 'react';

export default function ChipBar({ counts, active, onChange, showEmployers = false, showConnections = false }) {
  const [openMenu, setOpenMenu] = useState(null); // 'roles' | 'connections' | null
  const containerRef = useRef(null);

  // Close any open dropdown when clicking anywhere outside the chip bar
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!openMenu) return; // nothing open
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    // Use capture phase so we fire even if inner elements stop propagation
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [openMenu]);

  const roleItems = [
    { id: 'alumni', label: 'Alumni', count: counts?.alumni },
    { id: 'students', label: 'Students', count: counts?.students },
  ];
  if (showEmployers) {
    roleItems.push({ id: 'employers', label: 'Employers', count: counts?.employers });
  }

  const connectionItems = showConnections
    ? [
        { id: 'connected', label: 'Connections', count: counts?.connected ?? 0 },
        { id: 'received', label: 'Requests Received', count: counts?.received ?? 0 },
        { id: 'sent', label: 'Requests Sent', count: counts?.sent ?? 0 },
      ]
    : [];

  const isRolesActive = roleItems.some(item => item.id === active);
  const isMyConnectionsActive = connectionItems.some(item => item.id === active);

  const handleSelect = (id) => {
    onChange(id);
    setOpenMenu(null);
  };

  const GroupChip = ({
    groupId,
    label,
    items,
    isActive,
    activeLeafId,
  }) => {
    if (!items || items.length === 0) return null;

    const isOpen = openMenu === groupId;
    const selectedItem = items.find(i => i.id === activeLeafId) || items[0];

    const baseClasses = isActive
      ? 'bg-ocean-600 text-white border-ocean-600 shadow-sm'
      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300';

    return (
      <div className="relative inline-flex items-stretch">
        <button
          type="button"
          aria-pressed={isActive}
          aria-expanded={isOpen}
          className={`min-h-[36px] px-4 py-1.5 rounded-full border font-medium text-sm flex items-center gap-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 ${baseClasses}`}
          onClick={() => setOpenMenu(isOpen ? null : groupId)}
        >
          <span>{label}</span>
          <span className="text-xs text-slate-200/80 sm:text-slate-100/90 md:text-slate-100/90">
            {/* show current selection label inside the chip */}
            {selectedItem.label}
          </span>
          <span className="ml-1 text-xs">
            ▾
          </span>
        </button>
        <div
          className={`absolute left-0 top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg transform origin-top transition-all duration-150 z-30 ${
            isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <ul className="py-1 text-sm text-slate-700">
            {items.map(item => {
              const itemActive = item.id === activeLeafId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 ${
                      itemActive ? 'bg-ocean-50 text-ocean-700' : ''
                    }`}
                    onClick={() => handleSelect(item.id)}
                  >
                    <span>{item.label}</span>
                    {typeof item.count === 'number' && (
                      <span className="ml-2 text-xs text-slate-500 font-semibold">
                        {item.count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="flex flex-wrap gap-3 items-center py-3">
      {/* Roles group: Alumni / Students / Employers */}
      <GroupChip
        groupId="roles"
        label="Groups"
        items={roleItems}
        isActive={isRolesActive}
        activeLeafId={active}
      />
      {/* Connections section: single dropdown under "My Connections" (admin only) */}
      {showConnections && (
        <GroupChip
          groupId="connections"
          label="My Connections"
          items={connectionItems}
          isActive={isMyConnectionsActive}
          activeLeafId={active}
        />
      )}
    </div>
  );
}
