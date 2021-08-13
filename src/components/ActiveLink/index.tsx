import { ReactElement, cloneElement } from "react";
import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/router';

interface IActiveLinkProps extends LinkProps {
  children: ReactElement;
  activeClassName: string;
}

const ActiveLink = ({ children, activeClassName, ...rest }: IActiveLinkProps) => {
  const { asPath } = useRouter();
  return (
    <Link { ...rest }>
      {cloneElement(children, {
        className: asPath === rest.href ? activeClassName : ''
      })}
    </Link>
  );
}

export { ActiveLink };