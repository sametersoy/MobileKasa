import { Link } from 'react-router'

import logoBlack from '@/assets/images/logo-black.png'
import logoSm from '@/assets/images/logo-sm.png'
import logo from '@/assets/images/logo.png'

const AppLogo = () => {
  return (
    <Link to="/panel" className="logo">
      <span className="logo logo-light">
        <span className="logo-lg">
          <img src={logo} alt="logo" height={48} />
        </span>
        <span className="logo-sm">
          <img src={logoSm} alt="small logo" height={36} />
        </span>
      </span>
      <span className="logo logo-dark">
        <span className="logo-lg">
          <img src={logoBlack} alt="dark logo" height={48} />
        </span>
        <span className="logo-sm">
          <img src={logoSm} alt="small logo" height={36} />
        </span>
      </span>
    </Link>
  )
}

export default AppLogo
