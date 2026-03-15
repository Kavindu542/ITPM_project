import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthShell({
  children,
  panelTitle,
  panelDescription,
  panelButtonText,
  panelButtonTo,
  panelSide = 'right',
}) {
  const isRightPanel = panelSide === 'right';
  const panelImage =
    'https://t4.ftcdn.net/jpg/04/28/93/09/360_F_428930939_leNY57zgNgYL6FXFDPJPvs63N96D5hOg.jpg';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-8 font-sans md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[34px] bg-white shadow-[0_30px_80px_rgba(76,29,149,0.18)] lg:grid-cols-2">
          <div className={`${isRightPanel ? 'order-1' : 'order-2'} flex items-center justify-center px-6 py-10 sm:px-10 md:px-12 lg:min-h-[680px]`}>
            <div className="w-full max-w-md">{children}</div>
          </div>

          <div
            className={`${isRightPanel ? 'order-2 lg:rounded-l-[120px]' : 'order-1 lg:rounded-r-[120px]'} relative flex min-h-[320px] items-center justify-center overflow-hidden bg-slate-900 px-8 py-12 text-center text-white sm:px-12 lg:min-h-[680px]`}
          >
            <img
              src={panelImage}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-slate-950/35" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_30%)]" />
            <div className="absolute left-8 top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-10 right-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10 max-w-sm">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{panelTitle}</h2>
              <p className="mt-4 text-sm leading-6 text-white/85">{panelDescription}</p>
              <Link
                to={panelButtonTo}
                className="mt-8 inline-flex min-w-40 items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold tracking-wide text-white transition hover:bg-white/10"
              >
                {panelButtonText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
