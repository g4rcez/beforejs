import React from "react";

export const Main = ({ children }: any) => {
    return (
        <div className="bg-black text-white min-h-screen min-w-max">
            <div className="w-full container mx-auto h-auto">
                <h1 className="text-6xl font-bold mb-12">Main</h1>
                {children}
            </div>
        </div>
    );
};
