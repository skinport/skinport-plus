import type { SVGProps } from "react";

export function SkinportPlusLogo({
  isInverted,
  ...props
}: { isInverted?: boolean } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 809.26 163.2"
      width={134}
      height={27}
      {...props}
    >
      <title>Skinport Plus</title>
      <path
        d="m119.15 116.57 32.23 44.98h22.8l-32.23-44.98h-22.8zM100.3 77.05v84.5h18.85v-84.5H100.3z"
        fill={isInverted ? "#1d2021" : "#fff"}
      />
      <path d="M150.82 77.05h21.89v21.89h-21.89z" fill="#fa490a" />
      <path
        fill={isInverted ? "#1d2021" : "#fff"}
        d="M202.83 77.05h18.86v84.49h-18.86V77.05Zm115.68 54.39-41.46-54.39H259.4v84.49h18.86V108.6l40.25 52.94h18.86V77.05h-18.86v54.39Zm-276.75-20.6c-8.02-1.97-13.14-3.69-15.35-5.14-2.22-1.45-3.32-3.4-3.32-5.86s.91-4.43 2.72-5.92c1.81-1.49 4.29-2.24 7.43-2.24 7.82 0 15.39 2.78 22.72 8.34l9.55-13.78c-4.19-3.55-9.11-6.29-14.75-8.22-5.64-1.93-11.28-2.9-16.92-2.9-8.62 0-15.82 2.18-21.58 6.53C6.5 86 3.62 92.19 3.62 100.2s2.28 13.9 6.83 17.65c4.55 3.75 11.74 6.79 21.58 9.13 6.2 1.53 10.35 3.04 12.45 4.53 2.09 1.49 3.14 3.51 3.14 6.04s-.99 4.55-2.96 6.04c-1.98 1.49-4.7 2.24-8.16 2.24-7.74 0-16.16-3.99-25.26-11.97L0 147.64c10.72 9.91 22.76 14.87 36.14 14.87 9.27 0 16.74-2.36 22.42-7.07 5.68-4.71 8.52-10.86 8.52-18.43s-2.22-13.34-6.65-17.29c-4.43-3.95-10.66-6.91-18.68-8.88Zm505.26 8.58c.02-24.37-19.54-44.01-43.85-44.01-24.3 0-43.85 19.65-43.82 44.05.03 24.27 19.57 43.76 43.84 43.75 24.24-.01 43.81-19.56 43.84-43.78Zm-18.4-.21c.08 14.08-11.52 25.82-25.47 25.79-13.97-.04-25.49-11.74-25.43-25.84.06-14.03 11.48-25.42 25.48-25.41 14.01 0 25.34 11.36 25.42 25.46ZM731 77.11h-68.37v16.65h25.75v67.8h18.86v-67.8H731V77.11Zm-289.84 30.31c0 20.43-13.2 32.15-34.98 32.15h-12.26v21.99h-18.86V77.11l30.09.03c22.42 0 36 11.04 36 30.28Zm-18.12.93c0-6.39-3.04-14.65-19.38-14.65h-9.74v29.29h10.77c14.68 0 18.35-8.26 18.35-14.65Zm-303.9 8.23 32.23 44.98h22.8l-32.23-44.98h-22.8Zm-18.86-39.52v84.49h18.86V77.06h-18.86Zm521.95 84.49-15.79-22.03c-.35 0-.68.04-1.04.04h-12.25v22h-18.86V77.07l30.08.07c22.42 0 36 11.04 36 30.28 0 13.09-5.45 22.58-15.07 27.73l18.93 26.41h-22Zm-29.08-38.56h10.76c14.68 0 18.35-8.26 18.35-14.65s-3.04-14.65-19.38-14.65h-9.73v29.29Z"
      />
      <path
        d="M809.26 27.37v15.72h-27.37v27.37h-15.72V43.09H738.8V27.37h27.37V0h15.72v27.37h27.37z"
        fill="#fa490a"
      />
    </svg>
  );
}
