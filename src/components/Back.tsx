import React from 'react'
import './Back.css'


type Props = {children?: React.ReactNode}

const Back:React.FC<Props> = ({children}) => {
  return (
    <div className='back'>
      {children}
    </div>
  )
}

export default Back
