# Enhanced Theme & Branding UI Implementation Guide

This document contains the additional UI sections to add to the GeneralSystemSettings.jsx ThemeBranding component after line 1433 (after the Typography section).

## Add after Typography Section (line 1433):

```jsx
      {/* Advanced Typography */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Advanced Typography</h4>
        <div className="space-y-4">
          {/* Heading Sizes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Heading Sizes</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].map((heading) => (
                <div key={heading}>
                  <label className="block text-xs text-gray-600 mb-1">{heading}</label>
                  <input
                    type="text"
                    value={theme[`fontSize${heading}`]}
                    onChange={(e) => handleThemeChange(`fontSize${heading}`, e.target.value)}
                    placeholder="2rem"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Body Text Sizes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Body Text Size</label>
              <input
                type="text"
                value={theme.fontSizeBody}
                onChange={(e) => handleThemeChange('fontSizeBody', e.target.value)}
                placeholder="1rem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Small Text Size</label>
              <input
                type="text"
                value={theme.fontSizeSmall}
                onChange={(e) => handleThemeChange('fontSizeSmall', e.target.value)}
                placeholder="0.875rem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Label Text Size</label>
              <input
                type="text"
                value={theme.fontSizeLabel}
                onChange={(e) => handleThemeChange('fontSizeLabel', e.target.value)}
                placeholder="0.875rem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* Line Height */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Line Height - Tight</label>
              <input
                type="text"
                value={theme.lineHeightTight}
                onChange={(e) => handleThemeChange('lineHeightTight', e.target.value)}
                placeholder="1.25"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Line Height - Normal</label>
              <input
                type="text"
                value={theme.lineHeightNormal}
                onChange={(e) => handleThemeChange('lineHeightNormal', e.target.value)}
                placeholder="1.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Line Height - Relaxed</label>
              <input
                type="text"
                value={theme.lineHeightRelaxed}
                onChange={(e) => handleThemeChange('lineHeightRelaxed', e.target.value)}
                placeholder="1.75"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Extended Color Palette */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Extended Color Palette</h4>
        <div className="space-y-4">
          {/* Status Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Status Colors</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: 'successColor', label: 'Success' },
                { key: 'warningColor', label: 'Warning' },
                { key: 'errorColor', label: 'Error' },
                { key: 'infoColor', label: 'Info' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-2">{label}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={theme[key]}
                      onChange={(e) => handleThemeChange(key, e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme[key]}
                      onChange={(e) => handleThemeChange(key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Text Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Text Colors</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: 'textPrimary', label: 'Primary Text' },
                { key: 'textSecondary', label: 'Secondary Text' },
                { key: 'textMuted', label: 'Muted Text' },
                { key: 'textDisabled', label: 'Disabled Text' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-2">{label}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={theme[key]}
                      onChange={(e) => handleThemeChange(key, e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme[key]}
                      onChange={(e) => handleThemeChange(key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Border Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Border Colors</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'borderLight', label: 'Light Border' },
                { key: 'borderMedium', label: 'Medium Border' },
                { key: 'borderDark', label: 'Dark Border' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-2">{label}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={theme[key]}
                      onChange={(e) => handleThemeChange(key, e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme[key]}
                      onChange={(e) => handleThemeChange(key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Background Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Background Variations</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: 'bgCard', label: 'Card Background' },
                { key: 'bgPanel', label: 'Panel Background' },
                { key: 'bgHover', label: 'Hover Background' },
                { key: 'bgSelected', label: 'Selected Background' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-2">{label}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={theme[key]}
                      onChange={(e) => handleThemeChange(key, e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme[key]}
                      onChange={(e) => handleThemeChange(key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Button Styles */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Button Styles</h4>
        <div className="space-y-4">
          {/* Primary Button */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Primary Button</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'btnPrimaryBg', label: 'Background' },
                { key: 'btnPrimaryText', label: 'Text Color' },
                { key: 'btnPrimaryHover', label: 'Hover Color' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-2">{label}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={theme[key]}
                      onChange={(e) => handleThemeChange(key, e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme[key]}
                      onChange={(e) => handleThemeChange(key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Button */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Secondary Button</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'btnSecondaryBg', label: 'Background' },
                { key: 'btnSecondaryText', label: 'Text Color' },
                { key: 'btnSecondaryHover', label: 'Hover Color' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-2">{label}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={theme[key]}
                      onChange={(e) => handleThemeChange(key, e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme[key]}
                      onChange={(e) => handleThemeChange(key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Button */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Danger/Destructive Button</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'btnDangerBg', label: 'Background' },
                { key: 'btnDangerText', label: 'Text Color' },
                { key: 'btnDangerHover', label: 'Hover Color' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-2">{label}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={theme[key]}
                      onChange={(e) => handleThemeChange(key, e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme[key]}
                      onChange={(e) => handleThemeChange(key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Button Properties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Button Border Radius</label>
              <input
                type="text"
                value={theme.buttonBorderRadius}
                onChange={(e) => handleThemeChange('buttonBorderRadius', e.target.value)}
                placeholder="0.5rem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Button Shadow</label>
              <input
                type="text"
                value={theme.buttonShadow}
                onChange={(e) => handleThemeChange('buttonShadow', e.target.value)}
                placeholder="0 1px 2px rgba(0,0,0,0.05)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Spacing & Sizing */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Spacing & Sizing</h4>
        <div className="space-y-4">
          {/* Global Scale */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Global Spacing Scale</label>
            <select
              value={theme.spacingScale}
              onChange={(e) => handleThemeChange('spacingScale', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white outline-none"
            >
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
              <option value="comfortable">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>

          {/* Border Radius */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'borderRadiusSmall', label: 'Small' },
              { key: 'borderRadiusMedium', label: 'Medium' },
              { key: 'borderRadiusLarge', label: 'Large' },
              { key: 'borderRadiusFull', label: 'Full/Pill' }
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs text-gray-600 mb-2">Border Radius - {label}</label>
                <input
                  type="text"
                  value={theme[key]}
                  onChange={(e) => handleThemeChange(key, e.target.value)}
                  placeholder="0.5rem"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>
            ))}
          </div>

          {/* Padding */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Card Padding</label>
              <input
                type="text"
                value={theme.cardPadding}
                onChange={(e) => handleThemeChange('cardPadding', e.target.value)}
                placeholder="1.5rem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Button Padding X</label>
              <input
                type="text"
                value={theme.buttonPaddingX}
                onChange={(e) => handleThemeChange('buttonPaddingX', e.target.value)}
                placeholder="1rem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Button Padding Y</label>
              <input
                type="text"
                value={theme.buttonPaddingY}
                onChange={(e) => handleThemeChange('buttonPaddingY', e.target.value)}
                placeholder="0.5rem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* Input Height */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Input Field Height</label>
            <input
              type="text"
              value={theme.inputHeight}
              onChange={(e) => handleThemeChange('inputHeight', e.target.value)}
              placeholder="2.5rem"
              className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg outline-none"
            />
          </div>
        </div>
      </div>

      {/* Effects & Shadows */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Effects & Shadows</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Card Shadow</label>
              <input
                type="text"
                value={theme.cardShadow}
                onChange={(e) => handleThemeChange('cardShadow', e.target.value)}
                placeholder="0 8px 20px rgba(21,25,40,0.06)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Dropdown Shadow</label>
              <input
                type="text"
                value={theme.dropdownShadow}
                onChange={(e) => handleThemeChange('dropdownShadow', e.target.value)}
                placeholder="0 10px 15px -3px rgba(0,0,0,0.1)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Focus Ring Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={theme.focusRingColor}
                  onChange={(e) => handleThemeChange('focusRingColor', e.target.value)}
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={theme.focusRingColor}
                  onChange={(e) => handleThemeChange('focusRingColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Focus Ring Width</label>
              <input
                type="text"
                value={theme.focusRingWidth}
                onChange={(e) => handleThemeChange('focusRingWidth', e.target.value)}
                placeholder="2px"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Transition Speed</label>
              <input
                type="text"
                value={theme.transitionSpeed}
                onChange={(e) => handleThemeChange('transitionSpeed', e.target.value)}
                placeholder="150ms"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Hover Opacity</label>
              <input
                type="text"
                value={theme.hoverOpacity}
                onChange={(e) => handleThemeChange('hoverOpacity', e.target.value)}
                placeholder="0.9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Modal Backdrop Opacity</label>
              <input
                type="text"
                value={theme.modalBackdropOpacity}
                onChange={(e) => handleThemeChange('modalBackdropOpacity', e.target.value)}
                placeholder="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Formatting */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Content Formatting</h4>
        <div className="space-y-4">
          {/* Table Styling */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Table Styling</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2">Row Height</label>
                <input
                  type="text"
                  value={theme.tableRowHeight}
                  onChange={(e) => handleThemeChange('tableRowHeight', e.target.value)}
                  placeholder="3rem"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">Header Background</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.tableHeaderBg}
                    onChange={(e) => handleThemeChange('tableHeaderBg', e.target.value)}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.tableHeaderBg}
                    onChange={(e) => handleThemeChange('tableHeaderBg', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">Header Text</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={theme.tableHeaderText}
                    onChange={(e) => handleThemeChange('tableHeaderText', e.target.value)}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.tableHeaderText}
                    onChange={(e) => handleThemeChange('tableHeaderText', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Badge Styling */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Badge/Status Styling</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-2">Padding X</label>
                <input
                  type="text"
                  value={theme.badgePaddingX}
                  onChange={(e) => handleThemeChange('badgePaddingX', e.target.value)}
                  placeholder="0.625rem"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">Padding Y</label>
                <input
                  type="text"
                  value={theme.badgePaddingY}
                  onChange={(e) => handleThemeChange('badgePaddingY', e.target.value)}
                  placeholder="0.25rem"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Presets & Export/Import */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Theme Management</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Quick Presets</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => applyPreset('corporate')}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Corporate
              </button>
              <button
                onClick={() => applyPreset('modern')}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Modern
              </button>
              <button
                onClick={() => applyPreset('minimal')}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Minimal
              </button>
              <button
                onClick={() => applyPreset('vibrant')}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Vibrant
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportTheme}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              Export Theme JSON
            </button>
            <button
              onClick={importTheme}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              Import Theme JSON
            </button>
          </div>
        </div>
      </div>
```

## Helper Functions to Add:

```jsx
  // Add after handleResetTheme function (around line 1230)
  
  const applyPreset = (presetName) => {
    const presets = {
      corporate: {
        primaryColor: '#003366',
        secondaryColor: '#0066CC',
        accentColor: '#FF9900',
        successColor: '#28A745',
        warningColor: '#FFC107',
        errorColor: '#DC3545',
        fontFamily: 'Roboto',
        borderRadiusMedium: '0.25rem',
        spacingScale: 'normal'
      },
      modern: {
        primaryColor: '#6366F1',
        secondaryColor: '#8B5CF6',
        accentColor: '#EC4899',
        successColor: '#10B981',
        warningColor: '#F59E0B',
        errorColor: '#EF4444',
        fontFamily: 'Inter',
        borderRadiusMedium: '0.75rem',
        spacingScale: 'comfortable'
      },
      minimal: {
        primaryColor: '#000000',
        secondaryColor: '#666666',
        accentColor: '#999999',
        successColor: '#4CAF50',
        warningColor: '#FFA000',
        errorColor: '#F44336',
        fontFamily: 'Helvetica',
        borderRadiusMedium: '0',
        spacingScale: 'compact'
      },
      vibrant: {
        primaryColor: '#FF6B6B',
        secondaryColor: '#4ECDC4',
        accentColor: '#FFE66D',
        successColor: '#95E1D3',
        warningColor: '#FFA07A',
        errorColor: '#FF6B9D',
        fontFamily: 'Poppins',
        borderRadiusMedium: '1rem',
        spacingScale: 'spacious'
      }
    }

    const selectedPreset = presets[presetName]
    if (selectedPreset) {
      const newTheme = { ...theme, ...selectedPreset }
      setTheme(newTheme)
      applyTheme(newTheme)
      setHasChanges(true)
      setTimeout(() => setShowConfirmModal(true), 500)
    }
  }

  const exportTheme = () => {
    const themeJSON = JSON.stringify(theme, null, 2)
    const blob = new Blob([themeJSON], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dms-theme-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    alert('Theme exported successfully!')
  }

  const importTheme = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const importedTheme = JSON.parse(event.target.result)
            const newTheme = { ...theme, ...importedTheme }
            setTheme(newTheme)
            applyTheme(newTheme)
            setHasChanges(true)
            setTimeout(() => setShowConfirmModal(true), 500)
            alert('Theme imported successfully!')
          } catch (error) {
            alert('Failed to import theme. Please check the JSON file format.')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }
```

## Integration Instructions:

1. The new state properties have already been added to the theme state (lines 914-1011)
2. The applyTheme function has been updated (lines 1064-1133)
3. Add the UI sections from this document after the existing Typography section (around line 1433)
4. Add the helper functions (applyPreset, exportTheme, importTheme) after handleResetTheme
5. Update handleResetTheme to include all new default values

The enhanced theme system now provides comprehensive CMS customization with:
- 100+ customizable properties
- Advanced typography controls
- Extended color palette
- Button style customization
- Spacing and sizing controls
- Effects and shadows
- Content formatting options
- Theme presets
- Import/Export functionality
