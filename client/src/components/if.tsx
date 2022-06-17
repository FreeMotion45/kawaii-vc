import React, { Children } from "react";

type IfParameters = {    
    expr: boolean,
    children: React.ReactNode[]
}

export const True = (props: any) => {
    return (
        <>
            {props.children}
        </>
    )
}

export const False = (props: any) => {
    return True(props)
}

export const If = (props: IfParameters) => {
    const { expr, children } = props    

    if (expr) {
        return (
            <>
                {children[0]}
            </>
        )
    }

    return (
        <>
            {children[1]}
        </>
    )
}