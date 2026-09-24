import { Link } from 'react-router'

import logoBlack from '@/assets/images/logo-black.png'
import logo from '@/assets/images/logo.png'

const AuthLogo = () => {
  return (
    <>
      <Link to="/" className="logo-dark">
        <img src={logoBlack} alt="MobilKasa" style={{ height: 150, width: 'auto' }} />
      </Link>
      <Link to="/" className="logo-light">
        <img src={logo} alt="MobilKasa" style={{ height: 150, width: 'auto' }} />
      </Link>
    </>
  )
}

export default AuthLogo
