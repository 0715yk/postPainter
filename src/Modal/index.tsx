import * as React from "react";
import "./style.css";
import { createPortal } from "react-dom";

export interface Props
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  children: React.ReactNode;
}

export function ModalLayout({ children, ...props }: Props) {
  return (
    <div {...props}>
      <div className="content">{children}</div>
      <div className="dim"></div>
    </div>
  );
}

const parentEl = document.getElementById("root") as HTMLElement;

export function Modal({ children, ...props }: Props) {
  return createPortal(
    <ModalLayout {...props}>{children}</ModalLayout>,
    parentEl
  );
}
