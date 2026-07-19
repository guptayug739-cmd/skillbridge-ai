import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  isDarkMode: boolean;
  notifications: any[];
  unreadCount: number;
}

const initialState: UIState = {
  sidebarOpen: false,
  isDarkMode: false,
  notifications: [],
  unreadCount: 0,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen(state, action: PayloadAction<boolean>) { state.sidebarOpen = action.payload; },
    toggleDarkMode(state) { state.isDarkMode = !state.isDarkMode; },
    setNotifications(state, action: PayloadAction<any[]>) {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.read).length;
    },
    addNotification(state, action: PayloadAction<any>) {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    markAllRead(state) {
      state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
      state.unreadCount = 0;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, toggleDarkMode, setNotifications, addNotification, markAllRead } = uiSlice.actions;
export default uiSlice.reducer;
