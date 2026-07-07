export interface OnAppInit {
  onAppInit(): Promise<void>;
}

export interface OnAppDestroy {
  onAppDestroy(): Promise<void>;
}
