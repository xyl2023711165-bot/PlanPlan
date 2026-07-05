'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/settings', label: '设置' },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="header">
      <h1>PlanPlan</h1>
      <nav>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? 'active' : ''}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <style>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: white;
          padding: 18px 32px;
          box-shadow: 0 2px 20px rgba(0,0,0,0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #1a202c;
          letter-spacing: 2px;
        }

        .header nav {
          display: flex;
          gap: 8px;
        }

        .header nav a {
          padding: 8px 16px;
          color: #4a5568;
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .header nav a:hover {
          background: #f7fafc;
          color: #2d3748;
        }

        .header nav a.active {
          background: #2d3748;
          color: white;
        }
      `}</style>
    </header>
  );
}