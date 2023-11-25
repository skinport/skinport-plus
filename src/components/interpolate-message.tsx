import React from "react";
// @ts-expect-error: No typings available
import InterpolatePrimitive, { SYNTAX_I18NEXT } from "@doist/react-interpolate";

export const InterpolateMessage = ({
  message,
  values,
}: {
  message: string;
  values: Record<string, React.ReactNode>;
}) => (
  <InterpolatePrimitive
    syntax={SYNTAX_I18NEXT}
    string={message}
    mapping={values}
  />
);
