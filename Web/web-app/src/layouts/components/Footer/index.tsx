import { currentYear, META_DATA } from '@/config/constants'
import { Col, Container, Row } from 'react-bootstrap'

const Footer = () => {
  return (
    <>
      <footer className="footer">
        <Container fluid>
          <Row>
            <Col md={6} className="text-center text-md-start">
              © 2015 {META_DATA.name} By <span className="fw-semibold">{META_DATA.author}</span>
            </Col>
            <Col md={6}>
              <div className="text-md-end d-none d-md-block">
                <span className="fw-bold">mobilkasa.sametersoy.com</span> Free.
              </div>
            </Col>
          </Row>
        </Container>
      </footer>
    </>
  )
}

export default Footer
