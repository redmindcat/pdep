import React from 'react';
import AdminHome from '../pages/AdminHome';
import TextbookList from '../pages/TextbookList';
import TextbookRegister from '../pages/TextbookRegister';

const MainContents = ({ nowMainLabel, nowSubLabel, isRegisterPage, onNavigate }) => {
    
    const getPageContent = () => {
        //관리 홈
        if (nowMainLabel === "관리 홈") {
            return {
                component: <AdminHome />,
                className: "AdminHome"
            };
        }

        //교재
	if (nowMainLabel === "교재") {
		if (isRegisterPage || nowSubLabel === "교재 등록") {
			return { 
				component: <TextbookRegister onNavigate={onNavigate} />, 
				className: "TextbookRegister" 
			};
		}

		if (nowSubLabel === "교재 목록") {
			return {
				component: <TextbookList onNavigate={onNavigate} />,
				className: "TextbookList"
			};
		}
	}

        //그 외 준비 중
        return {
            component: <div className="temp-box">{nowMainLabel} 준비 중</div>,
            className: "UnknownPage"
        };
    };

    const { component, className } = getPageContent();
    return (
	<div className={`content-inner ${className}`}>{component}</div>
    );
};

export default MainContents;