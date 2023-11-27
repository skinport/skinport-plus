// @ts-expect-error: No typings available
import InterpolatePrimitive, { SYNTAX_I18NEXT } from "@doist/react-interpolate";
import { ReactNode } from "react";

export const InterpolateMessage = ({
  message,
  values,
}: {
  message: string;
  values: Record<string, ReactNode>;
}) => (
  <InterpolatePrimitive
    syntax={SYNTAX_I18NEXT}
    string={message}
    mapping={values}
  />
);
