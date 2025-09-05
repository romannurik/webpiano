const STANDARD_PROPS = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const TrumpetIcon = (props: any) => (
  <svg {...STANDARD_PROPS} {...props}>
    <path d="m10 9-1 1" />
    <path d="M12.17 11.83a2.83 2.83 0 0 1 4 0 2.83 2.83 0 0 1 0 4l-4.34 4.34a2.83 2.83 0 0 1-4 0 2.83 2.83 0 0 1 0-4" />
    <path d="m2 20 2 2" />
    <path d="m3 21 9.172-9.172A9.66 9.66 0 0 0 15 5V2.707a.707.707 0 0 1 1.207-.5l5.586 5.586a.707.707 0 0 1-.5 1.207H19a9.66 9.66 0 0 0-6.828 2.828" />
    <path d="m6 13-1 1" />
  </svg>
);

export const StringsIcon = (props: any) => (
  <svg {...STANDARD_PROPS} {...props}>
    <path d="M12 7c2.626 0 5 2.37 5 5 0 1.395-.73 2.546-1.342 3.285a2.5 2.5 0 0 0-2.649 4.218c-.76 1.362-1.88 2.497-4.58 2.497C5.214 22 2 18.786 2 15.571c0-2.7 1.134-3.821 2.496-4.58A2.5 2.5 0 0 0 8.714 8.34C9.453 7.73 10.604 7 12 7" />
    <path d="M19.5 4.5 13 11" />
    <path d="M19.5 4.5h1L22 3l-1-1-1.5 1.5z" />
    <path d="m5 19-3 3" />
  </svg>
);
