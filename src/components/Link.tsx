"use client";

import Link, { LinkProps } from "next/link";
import { forwardRef } from "react";

type Props = LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>;

const LinkBehavior = forwardRef<HTMLAnchorElement, Props>(function LinkBehavior(
  props,
  ref
) {
  return <Link ref={ref} {...props} />;
});

export default LinkBehavior;