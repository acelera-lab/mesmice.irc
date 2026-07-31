export interface TUIComponents {
  screen: any;
  header: any;
  channelList: any;
  userList: any;
  messageBox: any;
  statusBar: any;
  inputBar: any;
}

export interface TUIState {
  currentChannel: string;
  nickname: string;
  server: string;
  userCount: number;
  connected: boolean;
  notifications: Map<string, number>;
}
