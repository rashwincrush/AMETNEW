# Notifications Module — Button Audit (Read-Only)

Generated: 2025-10-02 20:31:53+05:30

Table schema
FileLineJSX KindTypeVariant (guess)On Glass?Classes (bg/text/border/ring)Size (≥44×44?)Focus OK?Ocean tokens?Issues

/Users/ashwin/CascadeProjects/ForgecircleNEW/ForgecircleNEWSUPABASE/frontend/src/components/Notifications/NotificationsPage.js:266 button text Primary N bg-gradient-to-b from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white rounded-lg Y Y Y 
/Users/ashwin/CascadeProjects/ForgecircleNEW/ForgecircleNEWSUPABASE/frontend/src/components/Notifications/NotificationsPage.js:272 button text Destructive N bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg Y Y Y 
/Users/ashwin/CascadeProjects/ForgecircleNEW/ForgecircleNEWSUPABASE/frontend/src/components/Notifications/NotificationsPage.js:310 button text Secondary N bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-lg Y Y Y 
/Users/ashwin/CascadeProjects/ForgecircleNEW/ForgecircleNEWSUPABASE/frontend/src/components/Notifications/NotificationsPage.js:335 button text Outline N border-2 border-ocean-600 text-ocean-600 hover:bg-ocean-600 hover:text-white rounded-lg Y Y Y 
/Users/ashwin/CascadeProjects/ForgecircleNEW/ForgecircleNEWSUPABASE/frontend/src/components/Notifications/NotificationsPage.js:345 button text Tabs (Unknown) N bg-gray-100 border-b-2 border-ocean-500 (active) N N Y no 44×44 on tabs (allowed if tabs not treated as buttons)
/Users/ashwin/CascadeProjects/ForgecircleNEW/ForgecircleNEWSUPABASE/frontend/src/components/Notifications/NotificationsPage.js:379 Link text Link-like N bg-ocean-50 on unread row highlight N N Y highlight only; not actionable control

Notes
- All actionable buttons now include min-h-[44px] and the required focus-visible ring styles.
- Unread row uses ocean background for selection emphasis.
- Tabs are not remapped; they are for navigation styling and not treated as actions for 44×44.
