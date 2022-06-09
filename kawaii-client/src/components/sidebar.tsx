import React from "react"
import Button from "react-bootstrap/Button"
import CSS from "csstype"

const channelNameStyle: CSS.Properties = {
    display: 'block',
    color: '#E2CFEA',
    fontSize: '1.25em',
    marginBottom: '5%',
}

const channelDescriptionStyle: CSS.Properties = {
    color: '#E2CFEA',
    fontSize: '.75em',
}

const optionsContainerStyle: CSS.Properties = {
    display: 'block',
    padding: '1%',
    backgroundColor: '#2C2C2C',
    borderColor: '#2C2C2C',
    borderRadius: '5px',
    height: '100vh',
}

const optionsCategoryContainerStyle: CSS.Properties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '1%',
    border: 'dashed 2px white'
}

const optionButtonStyle: CSS.Properties = {    
    margin: '1% 3% 1% 3%',
}

export const SideBar = () => {
    return (
        <div style={optionsContainerStyle}>
                <span style={channelNameStyle}>
                    Server options:
                </span>                

                <div style={optionsCategoryContainerStyle}>
                    <span style={channelDescriptionStyle}>
                        Channels:
                    </span>

                    <Button variant="light" style={optionButtonStyle}>
                        Add channel
                    </Button>
                    <Button variant="light" style={optionButtonStyle}>
                        Remove channel
                    </Button>
                </div>
        </div>
    )
}