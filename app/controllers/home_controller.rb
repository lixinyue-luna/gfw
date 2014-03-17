class HomeController < ApplicationController
  skip_before_filter :check_terms, :only => [:accept_and_redirect]

  before_filter :load_circles, :only => [:index]

  def index
    @visible = Api::Story.visible.first(3)
  end

  def accept_and_redirect
    cookies.permanent[ENV['TERMS_COOKIE'].to_sym] = true

    if cookies[:go_to_from_blog].nil?
      if cookies[:go_to].nil?
        redirect = root_path
      elsif cookies[:go_to] == root_path
        redirect = map_path
      else
        redirect = cookies[:go_to]
      end
    else
      redirect = ENV['BLOG_HOST']
    end

    redirect_to redirect
  end
end
